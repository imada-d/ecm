# routers/projects.py - 会社DB対応完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import schemas
import company_models
from auth_utils import get_current_user

router = APIRouter(prefix="/api/projects", tags=["工事"])

def get_db(current_user = Depends(get_current_user)):
    """会社DBを取得"""
    from company_database import get_company_session
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[schemas.Project])
def get_projects(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 全員が自分の工事のみ見る
    projects = db.query(company_models.Project).filter(
        company_models.Project.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return projects



@router.post("", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 期の設定を取得
    settings = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == "fiscal_settings"
    ).first()
    
    if not settings:
        # デフォルト値で作成
        settings = company_models.SystemSettings(
            key="fiscal_settings",
            fiscal_start_year=2000,
            fiscal_start_month=8,
            staff_code_digits=3
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    # 現在の期を計算
    now = datetime.now()
    if now.month >= settings.fiscal_start_month:
        current_period = now.year - settings.fiscal_start_year + 1
    else:
        current_period = now.year - settings.fiscal_start_year
    
    # 工事番号の重複チェック（同一ユーザー内のみ）
    existing = db.query(company_models.Project).filter(
        company_models.Project.project_code == project.project_code,
        company_models.Project.user_id == current_user.id  # ユーザーごとにチェック
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"工事番号 '{project.project_code}' は既に使用されています。"
        )
    
    db_project = company_models.Project(
        **project.dict(),
        user_id=current_user.id,  # company_idは不要、user_idのみ記録
        period=current_period      # ← ★期を追加
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}", response_model=schemas.Project)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = db.query(company_models.Project).filter(
        company_models.Project.id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_project = db.query(company_models.Project).filter(
        company_models.Project.id == project_id
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db_project.updated_at = datetime.now()
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_project = db.query(company_models.Project).filter(
        company_models.Project.id == project_id
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.get("/by-user/{user_id}", response_model=List[schemas.Project])
def get_projects_by_user(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="管理者のみアクセス可能")
    
    # 指定されたユーザーの工事を取得
    if user_id == 0:  # 全ユーザー
        projects = db.query(company_models.Project).offset(skip).limit(limit).all()
    else:
        projects = db.query(company_models.Project).filter(
            company_models.Project.user_id == user_id
        ).offset(skip).limit(limit).all()
    
    return projects