from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from models import GroupedAoi, GroupedAoiStatus, User
from database import SessionLocal
from typing import Annotated
from auth import get_current_user
from celery_app.tasks.analysis import run_analysis_task, update_group_status
from celery import chord

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
    group = db.query(GroupedAoi).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="グループが見つかりませんでした．")
    if group.status == GroupedAoiStatus.processing:
        raise HTTPException(status_code=409, detail="このグループは既に分析中です．")
    
    group.status = GroupedAoiStatus.processing
    db.commit()

    # 各筆に対する実行計画を作る．s（シグネチャ）で束ねておく．
    header = [run_analysis_task.s(fude.uuid, current_user.id) for fude in group.fudes]
    # 全部終わった後に呼ばれるコールバック
    callback = update_group_status.s(group_id)
    # chordでまとめて実行．第一引数にheaderの戻り値リストが自動で入る．
    chord(header)(callback)
    
    return {"message": f"{len(group.fudes)} tasks started"}
