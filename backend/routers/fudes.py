from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from models import Fude, User
from fastapi.responses import JSONResponse
import json
from pathlib import Path
from auth import get_current_user
from database import SessionLocal
from typing import Annotated
from functools import lru_cache

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# 同じ引数が与えられた時キャッシュが使える。
@lru_cache(maxsize=128)
def load_geojson(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/fudes")
def get_fudes(
    db: db_dependency,
    lat: float = Query(...), # クエリ文字列 lat=... で緯度を受け取る（必須）
    lon: float = Query(...), # クエリ文字列 lon=... で経度を受け取る（必須）
    zoom: int = Query(...),  # クエリ文字列 zoom=... でズームレベルを受け取る（必須）
    current_user: User = Depends(get_current_user) # 認証用
):
    # 簡易的な検索半径設定（zoomに応じて）
    # 緯度1度 = 111.1111…km（地球上どこでも）
    # 経度1度 ≒ 80km（日本で）（三角関数的な考え方）
    # 地表での距離 / 間をとって96km = radius_deg
    # 上の式でやると少し狭かった。また、エクセルの多項式近似は6次までで無理でした。
    radius_deg = {
        18: 0.004,
        17: 0.007, # ~200m
        16: 0.015,
        15: 0.025,
        14: 0.025, # 重いよ〜。
        13: 0.025,
        12: 0.025
    }.get(zoom, 0) # デフォルト値

    # ズーム率が低い時はDBのクエリ処理をさせない。
    if radius_deg == 0:
        return JSONResponse(content={
            "type": "FeatureCollection",
            "features": []
        })

    # SQLレベルで緯度経度の範囲でフィルタ（本来は空間インデックス等を使う）
    fudes = db.query(Fude).filter(
        Fude.centroid_lat.between(lat - radius_deg, lat + radius_deg),
        Fude.centroid_lon.between(lon - radius_deg, lon + radius_deg)
    ).all()

    # geojsonファイルを読み込み、中心からの距離でフィルタ
    result_features = []

    for fude in fudes:
        # まず、jsonファイルを開く。
        geojson_path = Path(fude.path)
        if not geojson_path.exists():
            print(f"{geojson_path}が見つかりませんでした。")
            continue
        geojson = load_geojson(geojson_path)
            
        # 今見ている筆ポリゴンを抽出
        target_feature = geojson["features"][fude.features_index]
        # FeatureCollectionは、crsフィールドを認識してくれないのでfeatureを組み直す。
        # 浅いコピーでいいよね？
        target_feature_nocrs = {
            "type": target_feature["type"],
            "geometry": {
                "type": target_feature["geometry"]["type"],
                "coordinates": target_feature["geometry"]["coordinates"]
            },
            "properties": target_feature["properties"]
        }

        result_features.append(target_feature_nocrs)

    return JSONResponse(content={
        "type": "FeatureCollection",
        "features": result_features
    })
