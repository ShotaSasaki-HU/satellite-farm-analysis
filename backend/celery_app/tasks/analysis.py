# tasks/analysis.py
from celery_app import celery
from pathlib import Path
from dotenv import load_dotenv
import os
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Fude, GroupedAoi, ImageGetLog
import json
from datetime import date, datetime, timedelta, timezone, time
from typing import List, Tuple
import requests
from requests.auth import HTTPBasicAuth
from time import sleep

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BACKEND_DIR / ".env")
PLANET_API_KEY = os.getenv('PLANET_API_KEY') # 必ず環境変数から読み込むべし

# Planet社のAPIを使って，1つの筆ポリゴンについて画像の取得を行う．
@celery.task
def run_analysis_task(fude_uuid: str, user_id: int):
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

        #################### 検索フィルターの定義ココカラ ####################
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
        missing_ranges = get_missing_date_ranges(fude_uuid=fude_uuid, db=db)
        date_filters = [] # 日付範囲のフィルター（複数可）

        for gte_date, lte_date in missing_ranges:
            gte = datetime.combine(gte_date, time.min).isoformat() + "+09:00"
            lte = datetime.combine(lte_date, time.max).isoformat() + "+09:00"

            date_range_filter = {
                "type": "DateRangeFilter",
                "field_name": "acquired",
                "config": {
                    # "gte": gte,
                    "gte": "2020-05-19T00:00:00.000+09:00",
                    "lte": lte
                }
            }
            date_filters.append(date_range_filter)
        
        # OrFilterで日付条件をまとめる．
        combined_date_filter = {
            "type": "OrFilter",
            "config": date_filters
        }
        
        # only get images which have <90% cloud coverage
        cloud_cover_filter = {
            "type": "RangeFilter",
            "field_name": "cloud_cover",
            "config": {
                "lte": 0.90 # 全体の雲量が50%とかでもAOIは写ってたりするため。
            }
        }

        # create a filter that combines our geo and date filters
        # could also use an "OrFilter"
        redding_reservoir = {
            "type": "AndFilter",
            "config": [
                geometry_filter,
                combined_date_filter,
                cloud_cover_filter
            ]
        }

        # logger.info(json.dumps(redding_reservoir, indent=2))

        #################### 検索フィルターの定義ココマデ ####################

        #################### 検索ココカラ ####################

        # Stats API request object
        stats_endpoint_request = {
            "interval": "year", # day, month, yearとか．bucketsの区切り方が変わる．
            "item_types": ["PSScene"],
            "filter": redding_reservoir
        }

        # fire off the POST request
        result = \
            requests.post(
                'https://api.planet.com/data/v1/stats',
                auth = HTTPBasicAuth(PLANET_API_KEY, ''),
                json = stats_endpoint_request
            )
        sleep(1)
        
        hit_count = 0
        for bucket in result.json()["buckets"]:
            hit_count += bucket["count"]
        logger.info(f"ヒット件数: {hit_count}件")

        ### 実際に検索（Quick Search）を実行 ###

        # Search API request object
        search_endpoint_request = {
          "item_types": ["PSScene"],
          "filter": redding_reservoir
        }

        auth = HTTPBasicAuth(PLANET_API_KEY, '')

        result = \
            requests.post(
                'https://api.planet.com/data/v1/quick-search',
                auth = auth,
                json = search_endpoint_request
            )
        sleep(1)
        result_json = result.json()

        TEMPFILE_DIR = BACKEND_DIR / "tempfiles"
        TEMPFILE_DIR.mkdir(exist_ok=True) # 存在しなければ作成

        # features配列から各オブジェクトのidフィールドを抽出してテキストファイルに出力
        path_ids = TEMPFILE_DIR / f"PSScene_ids_{fude_uuid}_user{user_id}.txt"

        count = 0
        with open(path_ids, mode='w') as f:
            while True:
                for feature in result_json.get('features', []):
                    f.write(feature.get('id') + '\n')
                    count += 1
                
                # 次のページがあれば取得
                next_url = result_json["_links"]["_next"]
                if not next_url:
                    break # 最後のページ

                result = requests.get(next_url, auth=auth)
                sleep(1)
                result_json = result.json()

        logger.info(f"Quick Search: {count}件")

        #################### 検索ココマデ ####################

        #################### ダウンロード前の準備ココカラ ####################

        #################### ダウンロード前の準備ココマデ ####################

        logger.info(f"完了: fude_uuid={fude_uuid}")

        return "ok"
    except Exception as e:
        logger.exception(f"エラー: fude_uuid={fude_uuid}, error={str(e)}")
        return "error"
    finally:
        db.close()

def get_missing_date_ranges(fude_uuid: str, db: Session) -> List[Tuple[date, date]]:
    """
    指定された筆ポリゴンについて，ImageGetLogに存在しない未取得日の間欠連続範囲（gte, lte）を返す．
    """
    JST = timezone(timedelta(hours=9))
    today = datetime.now(JST).date()
    start_of_year = date(today.year, 1, 1)

    # 今年の全日（集合）
    all_dates = {start_of_year + timedelta(days=i) for i in range((today - start_of_year).days + 1)}

    # DBから画像取得を試行済みの日付を得る．
    tried_dates = db.query(ImageGetLog.target_date).filter(ImageGetLog.polygon_uuid == fude_uuid).all()
    tried_dates_set = {row[0] for row in tried_dates}

    # 差集合
    missing_dates = sorted(all_dates - tried_dates_set) # 昇順
    
    # 空なら終了
    if not missing_dates:
        return []
    
    # 連続した日付をまとめる．
    date_ranges = []
    range_start = missing_dates[0]
    range_end = missing_dates[0]

    for d in missing_dates[1:]:
        if d == range_end + timedelta(days=1):
            range_end = d
        else:
            date_ranges.append((range_start, range_end))
            range_start = range_end = d # 新しい範囲
    # for文を抜けた時点で必ずappendしていない範囲が余っている．
    date_ranges.append((range_start, range_end))

    return date_ranges

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
                # group.status = "completed"
                group.status = "unprocessed"
            else:
                group.status = "failed"
            db.commit()
            
    except Exception as e:
        print(f"Group status update failed: {e}")
    finally:
        db.close()
