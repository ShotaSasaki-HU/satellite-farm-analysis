# backend/main.py

from fastapi import FastAPI, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI()

# 仮のユーザーデータ
fake_user = {
    "email": "test@example.com",
    "password": "password",  # 本来はハッシュ化されているべき
    "name": "テストユーザー"
}

# リクエスト用モデル
class LoginRequest(BaseModel):
    email: str
    password: str

# レスポンス用モデル
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# CORS設定（異なるオリジンからのリクエストを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # フロントからのアクセスを許可
    allow_credentials=True,                  # クッキーや認証情報も許可
    allow_methods=["*"],                     # GET, POST, PUT など全て許可
    allow_headers=["*"],                     # Authorization や Content-Type も許可
)

@app.post("/login")
def login(data: LoginRequest, response: Response):
    if data.email != fake_user["email"] or data.password != fake_user["password"]:
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが間違っています")
    
    # JWTを生成
    token = create_access_token(
        data={ "sub": data.email},
        expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,     # Don't forget!
        secure=True,       # Don't forget! HTTPSじゃないと有効にならない（ローカルならFalseでも可）
        samesite="Lax",    # Don't forget! または、Strict。
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return {"message": "ログイン成功"}

# 開発用サーバー起動
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
