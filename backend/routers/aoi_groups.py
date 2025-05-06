from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from models import User, GroupedAoi
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

@router.get("/aoi-groups")
def get_aoi_groups(
    db: db_dependency,
    user: User = Depends(get_current_user)
    ):
    groups = db.query(GroupedAoi).filter_by(user_id=user.id).all()
    return [{"id": g.id, "name": g.name} for g in groups]
