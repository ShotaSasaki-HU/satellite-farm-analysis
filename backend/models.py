from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base # database.py

# User という名前のテーブル定義を開始。Base を継承しているから「このクラスはテーブルです」とSQLAlchemyが認識。
class User(Base):
    __tablename__ = "users"

    # よく検索に使うならばindex=True
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)

    # 双方向リンク（あると便利）
    # 「このUserクラスのaoisはAOIクラスとつながってるよ。AOI側ではuser属性で戻ってこれるよ。」
    aois = relationship("AOI", back_populates="user")

class AOI(Base):
    __tablename__ = "aois"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    coordinates_json = Column(String)  # JSON文字列で保存（リストはDBに直接入らないので）
    user_id = Column(Integer, ForeignKey("users.id")) # 外部キー制約あり（この列に格納できるのは指定した外部の列だけ）

    # 双方向リンク（あると便利）
    # 「このAOIクラスのuserはUserクラスとつながってるよ。User側ではaois属性で戻ってこれるようにしてるよ。」
    user = relationship("User", back_populates="aois")
