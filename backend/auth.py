# auth.py: JWT周りの設定

import os

from datetime import datetime, timedelta, timezone
from jose import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from database import SessionLocal
from models import User
from sqlalchemy.orm import Session

# 秘密鍵（サーバーだけが知っているキー）
SECRET_KEY = os.environ['SATELLITE_FARM_ANALYSIS_JWT_SECRET_KEY'] # 必ず環境変数から読み込むべし
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (timedelta(minutes=expires_delta) or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    # encodeすると、ヘッダーは自動で生成される。
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

### トークン付きのアクセス制限（認証ガード）ココカラ ###

# tokenUrl="login"は、「そこに行ってトークンを取得するよ」とSwagger UIに教えているだけ。
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # トークン取得エンドポイント名

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Depends(oauth2_scheme)によって、tokenにリクエストヘッダのトークン文字列が自動で入る。
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token decode error")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
