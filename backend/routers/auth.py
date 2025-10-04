# backend/routers/auth.py - 完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import schemas
from master_database import get_master_db, generate_company_code, generate_verification_token
import master_database
from auth_utils import get_password_hash, verify_password, create_access_token, get_current_user
from config import ENABLE_EMAIL_VERIFICATION, APP_URL, PLANS

router = APIRouter(prefix="/api/auth", tags=["認証"])

@router.post("/register")
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_master_db)
):
    """既存会社へのユーザー追加（管理者が社内ユーザーを追加する用）"""
    # ユーザー名の重複チェック
    existing_user = db.query(master_database.User).filter(
        master_database.User.username == user_data.username
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # 会社IDが必須（既存会社への追加のみ）
    if not user_data.company_id:
        raise HTTPException(
            status_code=400,
            detail="会社IDが必要です。新規会社作成はスーパーアドミンにお問い合わせください"
        )
    
    company = db.query(master_database.Company).filter(
        master_database.Company.id == user_data.company_id
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="会社が見つかりません")
    
    # ユーザー作成
    user = master_database.User(
        company_id=user_data.company_id,
        username=user_data.username,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role or "user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # トークン生成
    access_token = create_access_token({"user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "company": company
    }

@router.post("/login")
def login(
    credentials: schemas.UserLogin,
    db: Session = Depends(get_master_db)
):
    """会社コード + ユーザー名 + パスワードでログイン"""
    # 会社の確認
    company = db.query(master_database.Company).filter(
        master_database.Company.company_code == credentials.company_code,
        master_database.Company.is_active == True
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="会社が見つかりません")
    
    # ユーザー認証
    user = db.query(master_database.User).filter(
        master_database.User.username == credentials.username,
        master_database.User.company_id == company.id
    ).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="認証に失敗しました")
    
    # ログイン時刻更新
    company.last_login_at = datetime.now()
    user.last_login_at = datetime.now()
    db.commit()
    
    access_token = create_access_token({"user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "company": company
    }

@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    """現在のユーザー情報取得"""
    db = next(get_master_db())
    company = db.query(master_database.Company).filter(
        master_database.Company.id == current_user.company_id
    ).first()
    
    return {
        "user": current_user,
        "company": company
    }

# ========== 将来のWeb公開用機能（環境変数で制御） ==========

@router.post("/company-register")
def company_register(
    company_data: schemas.CompanyRegister,
    db: Session = Depends(get_master_db)
):
    """
    一般ユーザーによる新規会社登録（Web公開時用）
    現在はENABLE_EMAIL_VERIFICATION=falseで無効化
    """
    if not ENABLE_EMAIL_VERIFICATION:
        raise HTTPException(
            status_code=403,
            detail="一般登録は現在利用できません。スーパーアドミンにお問い合わせください"
        )
    
    # ランダム会社コード生成
    company_code = generate_company_code(db)
    verification_token = generate_verification_token()
    
    # プラン設定
    plan = PLANS["free"]
    
    # 会社作成（メール認証待ち）
    company = master_database.Company(
        company_code=company_code,
        name=company_data.company_name,
        email=company_data.email,
        plan_type="free",
        max_users=plan["max_users"],
        max_projects=plan["max_projects"],
        storage_limit_mb=plan["storage_limit_mb"],
        data_retention_days=plan["data_retention_days"],
        is_active=False,  # メール認証待ち
        verification_token=verification_token
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    
    # 管理者ユーザーも仮作成
    admin_user = master_database.User(
        company_id=company.id,
        username=company_data.admin_username,
        name=f"{company_data.company_name} 管理者",
        password_hash=get_password_hash(company_data.admin_password),
        role="admin",
        is_active=False  # メール認証待ち
    )
    db.add(admin_user)
    db.commit()
    
    # TODO: 実際のメール送信処理（SendGrid等）
    verification_url = f"{APP_URL}/verify?token={verification_token}"
    print(f"""
    ===== 認証メール（開発環境） =====
    To: {company_data.email}
    
    以下のURLをクリックして登録を完了してください：
    {verification_url}
    
    会社コード: {company_code}
    ===================================
    """)
    
    return {
        "message": "仮登録完了。メールを確認してください。",
        "company_code": company_code
    }

@router.get("/verify")
def verify_email(
    token: str,
    db: Session = Depends(get_master_db)
):
    """メール認証（Web公開時用）"""
    if not ENABLE_EMAIL_VERIFICATION:
        raise HTTPException(status_code=404, detail="メール認証は現在無効です")
    
    company = db.query(master_database.Company).filter(
        master_database.Company.verification_token == token
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="無効なトークンです")
    
    # 会社とユーザーを有効化
    company.is_active = True
    company.verified_at = datetime.now()
    company.verification_token = None
    
    # 管理者ユーザーも有効化
    admin_user = db.query(master_database.User).filter(
        master_database.User.company_id == company.id,
        master_database.User.role == "admin"
    ).first()
    if admin_user:
        admin_user.is_active = True
    
    db.commit()
    
    # 会社専用DBを初期化
    from company_database import get_company_engine, get_company_session
    from company_models import CompanyBase, CostCategory, SystemSettings
    
    engine = get_company_engine(company.id)
    CompanyBase.metadata.create_all(bind=engine)
    
    # 初期データ投入
    company_db = get_company_session(company.id)
    
    # カテゴリの初期データ
    categories = [
        {"name": "材料費", "color": "#3B82F6", "display_order": 1, "is_default": True},
        {"name": "外注費", "color": "#EF4444", "display_order": 2, "is_default": True},
        {"name": "経費", "color": "#10B981", "display_order": 3, "is_default": True},
        {"name": "その他", "color": "#6B7280", "display_order": 4, "is_default": True},
    ]
    for cat_data in categories:
        category = CostCategory(**cat_data)
        company_db.add(category)
    
    # システム設定の初期データ
    default_settings = [
        {"key": "fiscal_year_start_month", "value": "8"},
        {"key": "current_fiscal_period", "value": "1"},
        {"key": "unbilled_definition", "value": "completed"},
    ]
    for setting_data in default_settings:
        setting = SystemSettings(**setting_data)
        company_db.add(setting)
    
    company_db.commit()
    company_db.close()
    
    return {
        "message": "認証完了！ログイン画面からログインしてください。",
        "company_code": company.company_code
    }