# backend/company_database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
import os

CompanyBase = declarative_base()

def get_company_engine(company_id: int):
    """会社専用のDBエンジンを取得"""
    # dataフォルダ作成
    os.makedirs("data", exist_ok=True)
    
    # 会社専用DBパス
    db_path = f"./data/company_{company_id}.db"
    
    # エンジン作成
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False}
    )
    
    # テーブル作成（初回のみ）
    from company_models import CompanyBase
    CompanyBase.metadata.create_all(bind=engine)
    
    return engine

def get_company_session(company_id: int):
    """会社専用のセッションを取得"""
    engine = get_company_engine(company_id)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

# Depends用のファクトリー関数
def get_company_db_for_user(current_user):
    """ユーザーの会社DBを取得するジェネレーター"""
    if not current_user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()