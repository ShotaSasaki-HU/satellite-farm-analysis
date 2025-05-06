# backend/scripts/load_fudes.py
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from models import Fude
from database import SessionLocal, engine, Base, DATABASE_URL # database.py
import json
from sqlalchemy.orm import Session
import uuid

Base.metadata.create_all(bind=engine) # データベースに未作成のテーブルを作成

def load_fudes_from_dir(base_path: Path):
    session: Session = SessionLocal()
    session.query(Fude).delete()
    session.commit()

    count = 0
    for json_file in base_path.rglob("*.json"): # 再帰的探索rglob
        with open(json_file, "r", encoding="utf-8") as f:
            geojson = json.load(f)

        for idx, feature in enumerate(geojson.get("features", [])):
            polygon_uuid = feature["properties"].get("polygon_uuid", None)
            if polygon_uuid is None:
                print(f"{json_file}において、feature[{idx}]のUUIDが読み込めませんでした。")
                continue

            centroid_lat = feature["properties"].get("point_lat", None)
            centroid_lon = feature["properties"].get("point_lng", None)
            if (centroid_lat is None) or (centroid_lon is None):
                print(f"{json_file}において、feature[{idx}]の重心点座標が読み込めませんでした。")
                continue

            fude = Fude(
                # uuid=uuid.UUID(polygon_uuid),
                uuid=str(polygon_uuid),
                path=str(json_file),
                features_index=idx,
                centroid_lat=str(centroid_lat), # floatがいいよ。
                centroid_lon=str(centroid_lon),
            )
            session.add(fude)
            count += 1
            if count % 1000 == 0:
                session.commit()
                print(f"{count} fudes committed...")

    session.commit()
    session.close()
    print(f"完了: {count} 筆ポリゴンを {DATABASE_URL} に登録しました。")

if __name__ == "__main__":
    load_fudes_from_dir(Path("../data/fude_polygon_2024"))
