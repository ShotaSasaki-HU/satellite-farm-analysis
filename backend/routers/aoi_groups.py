from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import User, GroupedAoi
from main import db_dependency, get_current_user

router = APIRouter()

@router.get("/aoi-groups")
def get_aoi_groups(db: Session = db_dependency, user: User = Depends(get_current_user)):
    groups = db.query(GroupedAoi).filter_by(user_id=user.id).all()
    return [{"id": g.id, "name": g.name} for g in groups]
