from sqlalchemy import Column, Integer, Float, String, ForeignKey, Table, Index, Date, DateTime, Boolean
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
    uuid = Column(String, primary_key=True, index=True)
    path = Column(String, nullable=False) # 例: data/fude_polygon_2024/2024_01/2024_012345.json
    features_index = Column(Integer, nullable=False) # JSONファイルのfeaturesの中で何番目（アクセス用）
    centroid_lat = Column(Float, nullable=False) # 重心緯度（検索用）
    centroid_lon = Column(Float, nullable=False) # 重心経度（検索用）

    grouped_aois = relationship("GroupedAoi", secondary=grouped_aoi_fudes, back_populates="fudes")
    image_logs = relationship("ImageGetLog", back_populates="fude")

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
    status = Column(String, nullable=False)
    analysis_start_date = Column(Date, nullable=False) # 分析始点日（とりあえずその年の元旦とする．）

    user = relationship("User", back_populates="grouped_aois")
    fudes = relationship("Fude", secondary=grouped_aoi_fudes, back_populates="grouped_aois")

class ImageGetLog(Base):
    __tablename__ = "image_get_logs"

    id = Column(Integer, primary_key=True, nullable=False, index=True)
    polygon_uuid = Column(String, ForeignKey("fudes.uuid"), nullable=False, index=True) # 筆ポリゴンのuuid
    target_date = Column(Date, nullable=False)      # ユーザーが要求した日付
    data_exists = Column(Boolean, nullable=False)   # Planetに画像が存在するか．
    scene_id = Column(String, nullable=True)        # シーン（元の一枚絵）のid
    acquired_date = Column(DateTime, nullable=True) # 画像の撮影日時（JST）
    file_path = Column(String, nullable=True)       # 画像のパス
    udm2_path = Column(String, nullable=True)       # UDM2のパス
    checked_at = Column(DateTime, nullable=False)   # このログの記録日時（JST）

    # target_dateとchecked_atが近すぎる場合，まだ画像が公開されてないだけの可能性がある点に留意．

    fude = relationship("Fude", back_populates="image_logs")
