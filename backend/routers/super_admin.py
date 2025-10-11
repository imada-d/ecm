# backend/routers/super_admin.py - スーパー管理API
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
import jwt
from auth_utils import verify_password, create_access_token, SECRET_KEY, ALGORITHM
from master_database import get_master_db, SuperAdmin, Company, User
import master_database
from datetime import timedelta

router = APIRouter(prefix="/api/super", tags=["スーパー管理"])
security = HTTPBearer()

# スーパー管理者認証
async def get_current_super_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_master_db)
):
    """スーパー管理者の認証"""
    if not credentials:
        raise HTTPException(status_code=401, detail="認証が必要です")
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        super_admin_id: int = payload.get("super_admin_id")
        if super_admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid super admin token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    super_admin = db.query(SuperAdmin).filter(SuperAdmin.id == super_admin_id).first()
    if super_admin is None:
        raise HTTPException(status_code=401, detail="Super admin not found")
    
    return super_admin

@router.post("/login")
def super_login(
    username: str,
    password: str,
    db: Session = Depends(get_master_db)
):
    """スーパー管理者ログイン"""
    admin = db.query(SuperAdmin).filter(
        SuperAdmin.username == username
    ).first()
    
    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # スーパー管理者用のトークン生成（通常ユーザーとは別のキーを使用）
    access_token = create_access_token({"super_admin_id": admin.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": admin.username,
        "is_super_admin": True
    }

@router.get("/companies")
def get_all_companies(
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """全会社一覧取得"""
    companies = db.query(Company).all()
    result = []
    
    for company in companies:
        # DB容量計算
        db_path = f"./data/company_{company.id}.db"
        size_mb = 0
        if os.path.exists(db_path):
            size_mb = os.path.getsize(db_path) / 1024 / 1024
        
        # ユーザー数取得
        user_count = db.query(User).filter(User.company_id == company.id).count()
        
        result.append({
            "id": company.id,
            "name": company.name,
            "company_code": company.company_code,
            "plan_type": company.plan_type,
            "storage_used_mb": round(size_mb, 2),
            "storage_limit_mb": company.storage_limit_mb,
            "user_count": user_count,
            "max_users": company.max_users,
            "is_active": company.is_active,
            "created_at": company.created_at,
            "last_login_at": company.last_login_at
        })
    
    return result

@router.get("/companies/{company_id}/users")
def get_company_users(
    company_id: int,
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """会社のユーザー一覧取得"""
    users = db.query(User).filter(User.company_id == company_id).all()
    return [{
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "last_login_at": user.last_login_at
    } for user in users]

@router.put("/companies/{company_id}/toggle-active")
def toggle_company_active(
    company_id: int,
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """会社の有効/無効を切り替え"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.is_active = not company.is_active
    db.commit()
    
    return {"message": f"Company {'activated' if company.is_active else 'deactivated'}"}

@router.put("/companies/{company_id}/plan")
def update_company_plan(
    company_id: int,
    plan_type: str,
    max_users: int,
    storage_limit_mb: int,
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """会社のプラン変更"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.plan_type = plan_type
    company.max_users = max_users
    company.storage_limit_mb = storage_limit_mb
    db.commit()
    
    return {"message": "Plan updated successfully"}

@router.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """会社を完全削除"""
    # 1. マスターDBから削除
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_name = company.name
    
    # ユーザーも削除
    users = db.query(User).filter(User.company_id == company_id).all()
    for user in users:
        db.delete(user)
    
    db.delete(company)
    db.commit()
    
    # 2. 会社DBファイル削除
    db_path = f"./data/company_{company_id}.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # 3. バックアップも削除（存在する場合）
    backup_dir = f"./backups/company_{company_id}"
    if os.path.exists(backup_dir):
        shutil.rmtree(backup_dir)
    
    return {"message": f"Company '{company_name}' (ID: {company_id}) completely deleted"}

@router.post("/companies/{company_id}/backup")
def backup_company(
    company_id: int,
    current_admin = Depends(get_current_super_admin)
):
    """会社DBをバックアップ"""
    db_path = f"./data/company_{company_id}.db"
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Company DB not found")
    
    # バックアップフォルダ作成
    os.makedirs(f"./backups/company_{company_id}", exist_ok=True)
    
    # ファイルコピー
    backup_path = f"./backups/company_{company_id}/backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    shutil.copy2(db_path, backup_path)
    
    # バックアップサイズ
    size_mb = os.path.getsize(backup_path) / 1024 / 1024
    
    return {
        "backup_path": backup_path,
        "size_mb": round(size_mb, 2),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """システム統計"""
    total_companies = db.query(Company).count()
    active_companies = db.query(Company).filter(Company.is_active == True).count()
    paid_companies = db.query(Company).filter(Company.plan_type != "free").count()
    free_companies = db.query(Company).filter(Company.plan_type == "free").count()
    total_users = db.query(User).count()
    
    # 総容量計算
    total_size_mb = 0
    largest_db = {"company": None, "size_mb": 0}
    
    for company in db.query(Company).all():
        db_path = f"./data/company_{company.id}.db"
        if os.path.exists(db_path):
            size_mb = os.path.getsize(db_path) / 1024 / 1024
            total_size_mb += size_mb
            
            if size_mb > largest_db["size_mb"]:
                largest_db = {"company": company.name, "size_mb": size_mb}
    
    # マスターDBのサイズも計算
    master_db_size = 0
    if os.path.exists("./master.db"):
        master_db_size = os.path.getsize("./master.db") / 1024 / 1024
    
    return {
        "companies": {
            "total": total_companies,
            "active": active_companies,
            "paid": paid_companies,
            "free": free_companies
        },
        "users": {
            "total": total_users
        },
        "storage": {
            "total_mb": round(total_size_mb, 2),
            "total_gb": round(total_size_mb / 1024, 2),
            "master_db_mb": round(master_db_size, 2),
            "largest_company_db": {
                "company": largest_db["company"],
                "size_mb": round(largest_db["size_mb"], 2)
            }
        }
    }

# backend/routers/super_admin.py に追加

@router.get("/backups")
def get_all_backups(
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """全バックアップ一覧取得"""
    backups = []
    
    # backupsフォルダを探索
    backup_base = "./backups"
    if os.path.exists(backup_base):
        for company_folder in os.listdir(backup_base):
            if company_folder.startswith("company_"):
                company_id = int(company_folder.split("_")[1])
                company_path = os.path.join(backup_base, company_folder)
                
                # 会社名を取得
                company = db.query(Company).filter(Company.id == company_id).first()
                company_name = company.name if company else f"削除済み会社 (ID: {company_id})"
                
                # バックアップファイル一覧
                for backup_file in os.listdir(company_path):
                    if backup_file.endswith(".db"):
                        file_path = os.path.join(company_path, backup_file)
                        file_stats = os.stat(file_path)
                        
                        backups.append({
                            "company_id": company_id,
                            "company_name": company_name,
                            "filename": backup_file,
                            "size_mb": round(file_stats.st_size / 1024 / 1024, 2),
                            "created_at": datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                            "path": file_path
                        })
    
    # 作成日時でソート（新しい順）
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    return backups

@router.delete("/backups/{company_id}/{filename}")
def delete_backup(
    company_id: int,
    filename: str,
    current_admin = Depends(get_current_super_admin)
):
    """バックアップファイルを削除"""
    backup_path = f"./backups/company_{company_id}/{filename}"
    
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="Backup file not found")
    
    os.remove(backup_path)
    
    # フォルダが空になったら削除
    folder_path = f"./backups/company_{company_id}"
    if os.path.exists(folder_path) and not os.listdir(folder_path):
        os.rmdir(folder_path)

# backend/routers/super_admin.py に追加

from pydantic import BaseModel

# リクエストボディ用のスキーマ（他のスキーマの近くに追加）
class CreateCompanyRequest(BaseModel):
    name: str
    company_code: str = None
    email: str = None
    admin_username: str = None
    admin_password: str = None
    plan_type: str = "free"

@router.post("/companies/create")
def create_custom_company(
    request: CreateCompanyRequest,  # 🔥 ボディから受け取る
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """スーパーアドミンからカスタム会社を作成"""
    from master_database import generate_company_code
    from auth_utils import get_password_hash
    
    # 会社コード生成（指定がなければランダム）
    if not request.company_code:
        company_code = generate_company_code(db)
    else:
        company_code = request.company_code
        # 会社コード重複チェック
        existing = db.query(Company).filter(
            Company.company_code == company_code
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="この会社コードは既に使用されています")
    
    # プラン設定
    plan_settings = {
        "free": {
            "max_users": 3,
            "max_projects": 30,
            "storage_limit_mb": 50,
            "data_retention_days": 365
        },
        "paid": {
            "max_users": 10,
            "max_projects": 100,
            "storage_limit_mb": 500,
            "data_retention_days": 730
        },
        "premium": {
            "max_users": 999,
            "max_projects": 999,
            "storage_limit_mb": 10000,
            "data_retention_days": 9999
        }
    }
    plan = plan_settings.get(request.plan_type, plan_settings["free"])
    
    # データ保持期限計算
    expires_at = datetime.now() + timedelta(days=plan["data_retention_days"])
    
    # 会社作成（スーパーアドミンからの作成は即座にアクティブ）
    company = Company(
        company_code=company_code,
        name=request.name,
        email=request.email or f"admin@{company_code}.local",
        plan_type=request.plan_type,
        max_users=plan["max_users"],
        max_projects=plan["max_projects"],
        storage_limit_mb=plan["storage_limit_mb"],
        data_retention_days=plan["data_retention_days"],
        is_active=True,
        verified_at=datetime.now(),
        expires_at=expires_at
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    
    # 会社DB初期化
    from company_database import get_company_engine
    from company_models import CompanyBase
    engine = get_company_engine(company.id)
    CompanyBase.metadata.create_all(bind=engine)
    
    # 管理者ユーザー作成
    admin_user = User(
        company_id=company.id,
        username=request.admin_username or "admin",
        name=request.admin_username or f"{request.name} 管理者",
        password_hash=get_password_hash(request.admin_password or "admin123"),
        role="admin"
    )
    db.add(admin_user)
    db.commit()
    
    return {
        "company_id": company.id,
        "company_code": company_code,
        "admin_credentials": {
            "username": admin_user.username,
            "password": request.admin_password or "admin123"
        },
        "message": f"会社 {request.name} を作成しました"
    }

@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    new_password: str = "password123",  # デフォルト値
    db: Session = Depends(get_master_db),
    current_admin = Depends(get_current_super_admin)
):
    """ユーザーのパスワードをリセット"""
    from auth_utils import get_password_hash
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 新しいパスワードをハッシュ化して保存
    user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {
        "message": "パスワードをリセットしました",
        "user_id": user_id,
        "username": user.username,
        "new_password": new_password  # 一時的に表示
    }
    