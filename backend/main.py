# backend/main.py

from fastapi import FastAPI, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from database import SessionLocal, engine, Base # database.py
from models import User # models.py
from sqlalchemy.orm import Session
from typing import Annotated
from password_utils import verify_password, hash_password
from datetime import timedelta
from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from routers import fudes, grouped_aois, analysis

app = FastAPI()
app.include_router(fudes.router)
app.include_router(grouped_aois.router)
app.include_router(analysis.router)

# データベースに未作成のテーブルを作成
Base.metadata.create_all(bind=engine)

# 仮想ユーザーの登録
db = SessionLocal()
fake_user = {
    "email": "test@example.com",
    "password": hash_password(password="p@ssword"),
    "name": "開発ユーザー1"
}
fake_user = {
    "email": "test2@example.com",
    "password": hash_password(password="p@ssword"),
    "name": "開発ユーザー2"
}
# ユーザーが既に存在しない場合のみ追加
user_exists = db.query(User).filter(User.email == fake_user["email"]).first()
if not user_exists:
    db_user = User(
        email=fake_user["email"],
        hashed_password=fake_user["password"],
        name=fake_user["name"]
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
db.close()

# DBセッションを使えるようにする関数。
# FastAPIの Depends を使ってエンドポイント内で注入できる。
def get_db():
    db = SessionLocal() # セッションの作成
    try:
        # yieldの存在よりget_dbはジェネレータ関数
        # FastAPIでは、レスポンス作成の前にyieldまでが自動で走る。
        yield db
    finally: # yield文に続くコードは、レスポンスを作成した後、送信する前に実行される。
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# リクエスト用モデル
class LoginRequest(BaseModel):
    email: str
    password: str

# CORS設定（異なるオリジンからのリクエストを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # フロントからのアクセスを許可
    allow_credentials=True,                  # クッキーや認証情報も許可
    allow_methods=["*"],                     # GET, POST, PUT など全て許可
    allow_headers=["*"],                     # Authorization や Content-Type も許可
)

@app.post("/login", response_model=None)
def login(data: LoginRequest, response: Response, db: db_dependency):
    user = db.query(User).filter(User.email == data.email).first()

    if user is None:
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが間違っています。")
    if not verify_password(plain_password=data.password, hashed_password=user.hashed_password):
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが間違っています。")
    
    # JWTを生成
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # HttpOnly
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,     # Don't forget!
        secure=False,       # Don't forget! HTTPSじゃないと有効にならない（ローカルならFalseでも可）
        samesite="Lax",    # Don't forget! または、Strict。
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return {"message": "ログイン成功"}

@app.get("/profile")
def read_profile(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name}

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "ログアウトしました"}

# 開発用サーバー起動
# if __name__ == "__main__":
#     uvicorn.run("main:app", host="localhost", port=8000, reload=True)
