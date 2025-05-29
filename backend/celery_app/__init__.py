# celery_app/__init__.py
# Celeryインスタンスの定義

from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

celery = Celery(
    "agri_eye",
    broker = os.getenv("CELERY_BROKER_URL"), # RedisのURL
    backend = os.getenv("CELERY_RESULT_BACKEND") # 結果保存用（任意）
)

# この自動装填装置はうまく動作しない．
# celery.autodiscover_tasks(["celery_app.tasks"])

import celery_app.tasks.analysis
