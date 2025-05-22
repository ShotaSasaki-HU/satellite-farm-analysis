from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from models import GroupedAoi, User, Fude
from database import SessionLocal
from typing import Annotated
from auth import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/start-analysis/{group_id}")
def start_analysis(
    group_id: int,
    db: db_dependency,
    current_user: User = Depends(get_current_user)
):
    group = db.query(GroupedAoi).filter_by(id=group_id, user_id=current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="グループが見つかりませんでした．")
    
    if group.status == "processing":
        raise HTTPException(status_code=409, detail="このグループは既に分析中です．")
    
    group.status = "processing"
    db.commit()

    # 本来ここで非同期に処理をキューに入れる処理などをする
    # e.g., Celeryにenqueue、または別スレッドで処理開始
    
    return {"message": "分析を開始しました．", "group_id": group_id}
