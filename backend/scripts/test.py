import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from celery_app.tasks.analysis import add

result = add.delay(4, 6)
print("タスク送信済み！待機中…")
print("結果:", result.get())
