# auth.py: JWT周りの設定

from pathlib import Path
from dotenv import load_dotenv
import os

from datetime import datetime, timedelta, timezone
from jose import jwt

from fastapi import Depends, HTTPException, Cookie
from jose import JWTError, jwt
from database import SessionLocal
from models import User
from sqlalchemy.orm import Session

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env") # 絶対パス

# 秘密鍵（サーバーだけが知っているキー）
SECRET_KEY = os.getenv('JWT_SECRET_KEY') # 必ず環境変数から読み込むべし
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    # encodeすると、ヘッダーは自動で生成される。
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

### トークン付きのアクセス制限（認証ガード）ココカラ ###

# mainからimportすると、circular importエラーを起こす。
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_token_from_cookie(access_token: str | None = Cookie(default=None)):
    if(access_token is None):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return access_token

# Depends(oauth2_scheme)によって、tokenにリクエストヘッダのトークン文字列が自動で入る。
def get_current_user(access_token: str = Depends(get_token_from_cookie), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token decode error")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
