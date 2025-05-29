# tasks/analysis.py
from celery_app import celery
from pathlib import Path
from dotenv import load_dotenv
import os
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Fude
import json

logger = logging.getLogger(__name__)

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")
PLANET_API_KEY = os.getenv('PLANET_API_KEY') # 必ず環境変数から読み込むべし

# 一つの筆ポリゴンについて画像の取得を行う．
@celery.task
def run_analysis_task(fude_uuid: int):
    logger.info(f"開始: fude_uuid={fude_uuid}")

    db: Session = SessionLocal() # DBセッション開始
    try:
        # 筆ポリゴンのレコードをDBから取得
        fude = db.query(Fude).filter_by(uuid=fude_uuid).first()
        if not fude:
            logger.warning(f"fude_uuid={fude_uuid}は存在しません．")
            return
        
        # GeoJSON作成
        geojson_path = Path(fude.path)
        if not geojson_path.exists():
            logger.warning(f"{geojson_path}が見つかりませんでした．")
            return
        with open(geojson_path, "r", encoding="utf-8") as f:
            geojson = json.load(f)
        
        target_feature = geojson["features"][fude.features_index] # 今見ている筆ポリゴンを抽出
        coordinates = target_feature["geometry"]["coordinates"]
        logger.info(f"座標: {coordinates}")

        logger.info(f"完了: fude_uuid={fude_uuid}")

    except Exception as e:
        logger.exception(f"エラー: fude_uuid={fude_uuid}, error={str(e)}")
    finally:
        db.close()
