# main.py - DB分離対応完全版
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

app = FastAPI(title="原価管理システムAPI")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # すべてのオリジンを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """
    アプリケーション起動時の処理
    """
    # 会社DBディレクトリの作成
    os.makedirs("data", exist_ok=True)
    
    # マスターDBの初期化
    from master_database import init_master_db
    init_master_db()
    
    print("✅ システム起動完了")

# ルーターの登録
from routers import auth, projects, costs, vendors, customers, categories, settings, dashboard, super_admin, users

app.include_router(super_admin.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(costs.router)
app.include_router(vendors.router)
app.include_router(customers.router)
app.include_router(categories.router)
app.include_router(settings.router)
app.include_router(dashboard.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {
        "message": "原価管理システムAPI - DB分離版",
        "version": "2.0.0",
        "features": {
            "multi_tenant": True,
            "separate_db": True,
            "super_admin": True,
            "staff_code": True
        }
    }

@app.get("/health")
def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "healthy",
        "database": "separated",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)