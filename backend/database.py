# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLAlchemyがDBと接続するための窓口であるengineを作る。
# aoi.dbがなければ自動作成
DATABASE_URL = "sqlite:///./aoi.db"
engine = create_engine(DATABASE_URL)

# セッションを作成する準備
SessionLocal = sessionmaker(bind=engine) # セッションを作るクラスを作成
# 実際にセッションを作るのはmain.py

# モデルクラスを作る。（テーブル定義を書く。）
# このクラスを継承して各モデル（テーブル）を作る。
Base = declarative_base()
