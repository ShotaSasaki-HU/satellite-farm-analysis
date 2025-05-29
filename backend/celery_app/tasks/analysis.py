# tasks/analysis.py
from celery_app import celery
from pathlib import Path
from dotenv import load_dotenv
import os
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Fude, GroupedAoi
import json
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")
PLANET_API_KEY = os.getenv('PLANET_API_KEY') # 必ず環境変数から読み込むべし

# Planet社のAPIを使って，1つの筆ポリゴンについて画像の取得を行う．
@celery.task
def run_analysis_task(fude_uuid: str):
    logger.info(f"開始: fude_uuid={fude_uuid}")

    db: Session = SessionLocal()
    try:
        # 筆ポリゴンのレコードをDBから取得
        fude = db.query(Fude).filter_by(uuid=fude_uuid).first()
        if not fude:
            logger.warning(f"fude_uuid={fude_uuid}は存在しません．")
            return "error"
        
        # 筆ポリゴンの座標を取得
        geojson_path = Path(fude.path)
        if not geojson_path.exists():
            logger.warning(f"{geojson_path}が見つかりませんでした．")
            return
        with open(geojson_path, "r", encoding="utf-8") as f:
            geojson = json.load(f)
        target_feature = geojson["features"][fude.features_index] # 今見ている筆ポリゴンを抽出
        coordinates = target_feature["geometry"]["coordinates"]

        ### 検索フィルターの定義 ###
        geo_json_geometry = {
            "type": "Polygon",
            "coordinates": coordinates
        }

        # filter for items the overlap with our chosen geometry
        geometry_filter = {
            "type": "GeometryFilter",
            "field_name": "geometry",
            "config": geo_json_geometry
        }

        # filter images acquired in a certain date range
        # ひとまず，元旦から実行日までを取得範囲とする．
        JST = timezone(timedelta(hours=9))
        dt_now = datetime.now(JST)
        date_range_filter = {
            "type": "DateRangeFilter",
            "field_name": "acquired",
            "config": {
                "gte": datetime(dt_now.year, 1, 1, tzinfo=JST).isoformat(),
                "lte": (dt_now  - timedelta(days = 1)).isoformat() # Planetの衛星データの更新にかかる時間を考慮して1日引く．
            }
        }
        logger.info(date_range_filter)

        logger.info(f"完了: fude_uuid={fude_uuid}")

        return "ok"
    except Exception as e:
        logger.exception(f"エラー: fude_uuid={fude_uuid}, error={str(e)}")
        return "error"
    finally:
        db.close()

@celery.task
def update_group_status(results, group_id: int):
    """
    全てのrun_analysis_taskが完了後に呼ばれる．
    成功 / 失敗を確認してGroupedAoi.statusを更新．
    """
    db: Session = SessionLocal()
    try:
        group = db.query(GroupedAoi).filter_by(id=group_id).first()
        if group:
            # resultsには各run_analysis_taskの戻り値が入っている．
            if all(res == "ok" for res in results):
                group.status = "completed"
            else:
                group.status = "failed"
            db.commit()
            
    except Exception as e:
        print(f"Group status update failed: {e}")
    finally:
        db.close()
