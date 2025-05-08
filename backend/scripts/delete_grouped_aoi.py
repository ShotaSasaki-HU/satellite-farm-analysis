# テーブルGroupedAoiを全消しする。

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from models import GroupedAoi
from database import SessionLocal, engine, Base # database.py
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine) # データベースに未作成のテーブルを作成

session: Session = SessionLocal()
session.query(GroupedAoi).delete()
session.commit()
