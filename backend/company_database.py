# backend/company_database.py
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
import os

CompanyBase = declarative_base()

# エンジンキャッシュ（モジュールレベル）
_engine_cache = {}

def get_company_engine(company_id: int):
    """会社専用のDBエンジンを取得（キャッシュ付き）"""
    # キャッシュチェック
    if company_id in _engine_cache:
        return _engine_cache[company_id]
    
    # dataフォルダ作成
    os.makedirs("data", exist_ok=True)
    
    # 会社専用DBパス
    db_path = f"./data/company_{company_id}.db"
    
    # エンジン作成
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={
            "check_same_thread": False,
            "timeout": 30  # タイムアウトを30秒に延長
        }
    )
    
    # WALモード有効化（複数ワーカー対応）
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")  # 30秒
        cursor.close()
    
    # テーブル作成（初回のみ）
    from company_models import CompanyBase
    CompanyBase.metadata.create_all(bind=engine)
    
    # キャッシュに保存
    _engine_cache[company_id] = engine
    
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