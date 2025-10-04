# backend/master_database.py
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, UniqueConstraint, event
from sqlalchemy.types import JSON 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import random
import string
import secrets

MasterBase = declarative_base()

class Company(MasterBase):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_code = Column(String, unique=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    plan_type = Column(String, default="free")
    
    max_users = Column(Integer, default=3)
    max_projects = Column(Integer, default=30)
    storage_limit_mb = Column(Integer, default=50)
    data_retention_days = Column(Integer, default=365)
    
    storage_used_mb = Column(Integer, default=0)
    
    is_active = Column(Boolean, default=False)
    verification_token = Column(String)
    verified_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.now)
    last_login_at = Column(DateTime)
    expires_at = Column(DateTime)
    
    users = relationship("User", back_populates="company")

class User(MasterBase):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    username = Column(String, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    staff_code = Column(String, nullable=True)  # 担当者番号
    permissions = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_login_at = Column(DateTime)
    
    company = relationship("Company", back_populates="users")
    
    __table_args__ = (
        UniqueConstraint('company_id', 'username', name='_company_username_uc'),
    )

class SuperAdmin(MasterBase):
    __tablename__ = "super_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

# DB接続
master_engine = create_engine(
    "sqlite:///./master.db",
    connect_args={
        "check_same_thread": False,
        "timeout": 30  # タイムアウトを30秒に延長
    }
)

# WALモード有効化（複数ワーカー対応）
@event.listens_for(master_engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")  # 30秒
    cursor.close()

MasterSessionLocal = sessionmaker(bind=master_engine)

def get_master_db():
    db = MasterSessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_master_db():
    """マスターDBの初期化"""
    MasterBase.metadata.create_all(bind=master_engine)
    
    # スーパー管理者の初期作成
    db = MasterSessionLocal()
    try:
        super_admin = db.query(SuperAdmin).filter(SuperAdmin.username == "superadmin").first()
        if not super_admin:
            from auth_utils import get_password_hash
            super_admin = SuperAdmin(
                username="superadmin",
                password_hash=get_password_hash("super123456")
            )
            db.add(super_admin)
            db.commit()
            print("✅ スーパー管理者を作成しました: superadmin / super123456")
    finally:
        db.close()

def generate_company_code(db) -> str:
    """ランダムな会社コードを生成（6文字）"""
    while True:
        code = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        existing = db.query(Company).filter(Company.company_code == code).first()
        if not existing:
            return code

def generate_verification_token() -> str:
    """メール認証用トークン生成"""
    return secrets.token_urlsafe(32)