# Celeryインスタンスの定義

from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

celery_app = Celery(
    "agri_eye",
    broker = os.getenv("CELERY_BROKER_URL"), # RedisのURL
    backend = os.getenv("CELERY_RESULT_BACKEND") # 結果保存用（任意）
)

celery_app.autodiscover_tasks(["celery_app"])
