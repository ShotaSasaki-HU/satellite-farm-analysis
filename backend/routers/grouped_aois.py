from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from models import GroupedAoi, User, Fude
from database import SessionLocal
from typing import Annotated
from auth import get_current_user
import json
from functools import lru_cache
from pydantic import BaseModel

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@lru_cache(maxsize=128)
def load_geojson(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/grouped-aoi")
def get_grouped_aoi(
    db: db_dependency,
    current_user: User = Depends(get_current_user)  # ユーザーidを取得
):
    grouped_aois = db.query(GroupedAoi).filter_by(user_id = current_user.id).all()
    
    result = []
    for group in grouped_aois:
        features = []

        for fude in group.fudes: # 中間テーブルより。
            geojson = load_geojson(Path(fude.path))
            target_feature = geojson["features"][fude.features_index]
            # FeatureCollectionは、crsフィールドを認識してくれないのでfeatureを組み直す。
            target_feature_nocrs = {
                "type": target_feature["type"],
                "geometry": {
                    "type": target_feature["geometry"]["type"],
                    "coordinates": target_feature["geometry"]["coordinates"]
                },
                "properties": target_feature["properties"]
            }
            features.append(target_feature_nocrs)

        result.append({
            "id": group.id,
            "name": group.name,
            "featureCollection": {
                "type": "FeatureCollection",
                "features": features
            }
        })

    return result

#######################################################

@router.post("/create-grouped-aoi/{name}")
def create_grouped_aoi(
    name: str,
    db: db_dependency,
    current_user: User = Depends(get_current_user)
):
    new_group = GroupedAoi(name = name, user_id = current_user.id)
    db.add(new_group)
    db.commit()
    db.refresh(new_group) # 自動採番されたidがここで入る．サーバー側でidを振って，idの重複を防止．

    return new_group

@router.post("/delete-grouped-aoi/{id}")
def create_grouped_aoi(
    id: int,
    db: db_dependency,
    current_user: User = Depends(get_current_user)
):
    target_group = db.query(GroupedAoi).filter(
        GroupedAoi.id == id,
        GroupedAoi.user_id == current_user.id
    ).first()

    if not target_group:
        raise HTTPException(status_code=404, detail="指定されたIDのGroupedAoiが見つかりません．")

    db.delete(target_group)
    db.commit()

#######################################################

@router.post("/grouped-aoi/{group_id}/{fude_uuid}")
def add_feature_to_group(
    group_id: int,
    fude_uuid: str,
    db: db_dependency,
    current_user: User = Depends(get_current_user)
):
    # グループと筆の取得
    grouped_aoi = db.query(GroupedAoi).filter_by(id=group_id).first()
    fude = db.query(Fude).filter_by(uuid=fude_uuid).first()

    if not grouped_aoi or not fude:
        raise HTTPException(status_code=404, detail="グループまたは筆ポリゴンが見つかりません．")

    # すでに紐づいているかを確認
    if fude in grouped_aoi.fudes:
        # 紐づいていれば削除（トグル的な動作）
        grouped_aoi.fudes.remove(fude)
    else:
        # 紐づいていなければ追加
        grouped_aoi.fudes.append(fude)

    db.commit()
