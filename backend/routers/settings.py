# routers/settings.py - 会社DB対応完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import schemas
import company_models
from auth_utils import get_current_user

router = APIRouter(prefix="/api/settings", tags=["設定"])

# 期の設定用のPydanticモデルを追加
class FiscalSettingsUpdate(BaseModel):
    fiscal_start_year: int
    fiscal_start_month: int
    staff_code_digits: Optional[int] = 3

class FiscalSettingsResponse(BaseModel):
    fiscal_start_year: int
    fiscal_start_month: int
    staff_code_digits: int
    current_period: int

def calculate_current_period(start_year: int, start_month: int) -> int:
    """現在の期を計算"""
    now = datetime.now()
    if now.month >= start_month:
        period = now.year - start_year + 1
    else:
        period = now.year - start_year
    return period

def get_db(current_user = Depends(get_current_user)):
    """会社DBを取得"""
    from company_database import get_company_session
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()

# === 期の設定専用エンドポイント（新規追加） ===
@router.get("/fiscal", response_model=FiscalSettingsResponse)
def get_fiscal_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """期の設定を取得"""
    settings = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == "fiscal_settings"
    ).first()
    
    if not settings:
        # デフォルト設定を作成
        settings = company_models.SystemSettings(
            key="fiscal_settings",
            fiscal_start_year=2000,
            fiscal_start_month=8,
            staff_code_digits=3
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    current_period = calculate_current_period(
        settings.fiscal_start_year, 
        settings.fiscal_start_month
    )
    
    return FiscalSettingsResponse(
        fiscal_start_year=settings.fiscal_start_year,
        fiscal_start_month=settings.fiscal_start_month,
        staff_code_digits=settings.staff_code_digits,
        current_period=current_period
    )

@router.put("/fiscal")
def update_fiscal_settings(
    settings_update: FiscalSettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """期の設定を更新（管理者のみ）"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="管理者権限が必要です")
    
    settings = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == "fiscal_settings"
    ).first()
    
    if not settings:
        settings = company_models.SystemSettings(key="fiscal_settings")
        db.add(settings)
    
    settings.fiscal_start_year = settings_update.fiscal_start_year
    settings.fiscal_start_month = settings_update.fiscal_start_month
    settings.staff_code_digits = settings_update.staff_code_digits
    settings.updated_at = datetime.now()
    
    db.commit()
    
    current_period = calculate_current_period(
        settings.fiscal_start_year,
        settings.fiscal_start_month
    )
    
    return {
        "message": "設定を更新しました",
        "current_period": current_period,
        "fiscal_start_year": settings.fiscal_start_year,
        "fiscal_start_month": settings.fiscal_start_month
    }

# === 既存のエンドポイント ===
@router.get("/{key}")
def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    setting = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == key
    ).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.get("", response_model=List[schemas.SystemSettings])
def get_all_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 会社DBから全設定を取得（権限関係なく読み取りは可能）
    settings = db.query(company_models.SystemSettings).all()
    
    # valueがNoneの場合はデフォルト値を設定
    for setting in settings:
        if setting.value is None:
            setting.value = ""  # または適切なデフォルト値
    
    return settings

@router.put("/{key}")
def update_setting(
    key: str, 
    update_data: schemas.SystemSettingsUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    setting = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == key
    ).first()
    
    if not setting:
        # 新規作成
        setting = company_models.SystemSettings(
            key=key,
            value=update_data.value
        )
        db.add(setting)
    else:
        setting.value = update_data.value
        setting.updated_at = datetime.now()
    
    db.commit()
    db.refresh(setting)
    return setting