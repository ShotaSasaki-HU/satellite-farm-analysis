from sqlalchemy import Column, Integer, Float, String, ForeignKey, Table, Index
from sqlalchemy.orm import relationship
from database import Base # database.py
# from sqlalchemy.dialects.postgresql import UUID

# 中間テーブル（多対多：GroupedAoi と Fude）
grouped_aoi_fudes = Table(
    "grouped_aoi_fudes",
    Base.metadata,
    Column("grouped_aoi_id", ForeignKey("grouped_aois.id"), primary_key=True),
    Column("fude_id", ForeignKey("fudes.uuid"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String)

    grouped_aois = relationship("GroupedAoi", back_populates="user")

class Fude(Base):
    __tablename__ = "fudes"

    # uuid使わないけど一意性のためにあったほうがいいのか？
    # uuid = Column(UUID(as_uuid=True), primary_key=True) # 汎用一意識別子UUID：世界に一つだけのID
    uuid = Column(String, primary_key=True)
    path = Column(String, nullable=False) # 例: data/fude_polygon_2024/2024_01/2024_012345.json
    features_index = Column(Integer, nullable=False) # JSONファイルのfeaturesの中で何番目（アクセス用）
    centroid_lat = Column(Float, nullable=False) # 重心緯度（検索用）
    centroid_lon = Column(Float, nullable=False) # 重心経度（検索用）

    grouped_aois = relationship("GroupedAoi", secondary=grouped_aoi_fudes, back_populates="fudes")

    __table_args__ = (
        Index("idx_lat", "centroid_lat"),
        Index("idx_lon", "centroid_lon"),
        Index("idx_lat_lon", "centroid_lat", "centroid_lon"),
    )

class GroupedAoi(Base):
    __tablename__ = "grouped_aois"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="grouped_aois")
    fudes = relationship("Fude", secondary=grouped_aoi_fudes, back_populates="grouped_aois")
