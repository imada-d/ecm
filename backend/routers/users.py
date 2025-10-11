# backend/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from auth_utils import get_current_user
from master_database import MasterSessionLocal, User
import bcrypt

router = APIRouter(prefix="/api", tags=["ユーザー管理"])

# デフォルト権限の定義
DEFAULT_PERMISSIONS = {
    "view_dashboard": True,
    "view_all_stats": False,
    "view_projects": True,
    "create_projects": False,
    "edit_projects": False,
    "delete_projects": False,
    "view_costs": True,
    "create_costs": False,
    "edit_costs": False,
    "delete_costs": False,
    "view_partners": True,
    "manage_partners": False,
    "manage_users": False,
    "manage_settings": False,
    "export_data": False,
    "super_admin": False
}

# リクエスト用のスキーマ
class UserCreate(BaseModel):
    username: str
    name: str
    password: str
    staff_code: Optional[str] = None
    permissions: Dict[str, bool] = DEFAULT_PERMISSIONS

class UserUpdate(BaseModel):
    name: Optional[str] = None
    staff_code: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

@router.get("/users")
def get_users(current_user = Depends(get_current_user)):
    # 管理者チェック（後で権限チェックに変更予定）
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="権限がありません")
    
    db = MasterSessionLocal()
    try:
        users = db.query(User).filter(User.company_id == current_user.company_id).all()
        
        for user in users:
            if not hasattr(user, 'permissions') or user.permissions is None or user.permissions == {}:
                user.permissions = DEFAULT_PERMISSIONS
                
        return users
    finally:
        db.close()

@router.post("/users")
def create_user(
    user_data: UserCreate,
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="権限がありません")
    
    db = MasterSessionLocal()
    try:
        # 既存ユーザーチェック
        existing = db.query(User).filter(
            User.username == user_data.username,
            User.company_id == current_user.company_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="ユーザーIDが既に存在します")
        
        # 担当者番号の重複チェック
        if user_data.staff_code:
            existing_staff = db.query(User).filter(
                User.staff_code == user_data.staff_code,
                User.company_id == current_user.company_id
            ).first()
            
            if existing_staff:
                raise HTTPException(status_code=400, detail=f"担当者番号 '{user_data.staff_code}' は既に使用されています")
        
        # パスワードをハッシュ化
        hashed = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
        
        # ユーザー作成
        new_user = User(
            username=user_data.username,
            name=user_data.name,
            password_hash=hashed.decode('utf-8'),
            company_id=current_user.company_id,
            staff_code=user_data.staff_code,
            permissions=user_data.permissions,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        return {"message": "ユーザーを追加しました"}
    finally:
        db.close()

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="権限がありません")
    
    db = MasterSessionLocal()
    try:
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == current_user.company_id
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        # 更新可能なフィールドのみ更新
        if user_data.name is not None:
            user.name = user_data.name
        if user_data.staff_code is not None:
            # 担当者番号の重複チェック（自分以外）
            if user_data.staff_code:  # 空文字でない場合
                existing_staff = db.query(User).filter(
                    User.staff_code == user_data.staff_code,
                    User.company_id == current_user.company_id,
                    User.id != user_id  # 自分自身は除外
                ).first()
                
                if existing_staff:
                    raise HTTPException(status_code=400, detail=f"担当者番号 '{user_data.staff_code}' は既に使用されています")
            
            user.staff_code = user_data.staff_code
        if user_data.permissions is not None:
            user.permissions = user_data.permissions
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        if user_data.password is not None:
            hashed = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
            user.password_hash = hashed.decode('utf-8')
        
        db.commit()
        return {"message": "ユーザー情報を更新しました"}
    finally:
        db.close()

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="権限がありません")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="自分自身は削除できません")
    
    db = MasterSessionLocal()
    try:
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == current_user.company_id
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        db.delete(user)
        db.commit()
        return {"message": "削除しました"}
    finally:
        db.close()