from fastapi import APIRouter, Query
from sqlalchemy.orm import Session
from main import db_dependency
from models import Fude
from fastapi.responses import JSONResponse
import json
from pathlib import Path

router = APIRouter()

@router.get("/fudes")
def get_fudes(
    lat: float = Query(...), # クエリ文字列 lat=... で緯度を受け取る（必須）
    lon: float = Query(...), # クエリ文字列 lon=... で経度を受け取る（必須）
    zoom: int = Query(...),  # クエリ文字列 zoom=... でズームレベルを受け取る（必須）
    db: Session = db_dependency,
):
    # 簡易的な検索半径設定（zoomに応じて）
    # 緯度1度 = 111.1111…km（地球上どこでも）
    # 経度1度 ≒ 80km（日本で）（三角関数的な考え方）
    # 地表での距離 / 間をとって96km = radius_deg
    radius_deg = {
        17: 0.002,  # ~200m
        16: 0.004,
        15: 0.008,
        14: 0.02,   # ~2km
    }.get(zoom, 0.01)  # デフォルト0.01

    # 全Fude取得（本来は空間インデックス等を使う）
    fudes = db.query(Fude).all()

    # geojsonファイルを読み込み、中心からの距離でフィルタ
    result_features = []

    for fude in fudes:
        # fudeが視点の座標近傍ならば。
        if (abs(lat - fude.centroid_lat) < radius_deg) and (abs(lon - fude.centroid_lon) < radius_deg):
            # まず、jsonファイルを開く。
            geojson_path = Path(fude.path)
            if not geojson_path.exists():
                print(f"{geojson_path}が見つかりませんでした。")
                continue
            with open(geojson_path, "r", encoding="utf-8") as f:
                geo = json.load(f)
            
            # 
            result_features.extend(geo["features"])

    return JSONResponse(content={
        "type": "FeatureCollection",
        "features": result_features
    })
