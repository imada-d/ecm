# routers/costs.py - 会社DB対応完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import schemas
import company_models
from auth_utils import get_current_user

router = APIRouter(prefix="/api/costs", tags=["原価"])

def get_db(current_user = Depends(get_current_user)):
    """会社DBを取得"""
    from company_database import get_company_session
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[schemas.Cost])
def get_costs(
    project_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(company_models.Cost)
    
    if project_id:
        query = query.filter(company_models.Cost.project_id == project_id)
    
    costs = query.offset(skip).limit(limit).all()
    return costs

@router.post("", response_model=schemas.Cost)
def create_cost(
    cost: schemas.CostCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # プロジェクトの存在確認（会社DB内のみ）
    project = db.query(company_models.Project).filter(
        company_models.Project.id == cost.project_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=403, detail="Project not found")
    
    db_cost = company_models.Cost(**cost.dict())
    db.add(db_cost)
    db.commit()
    db.refresh(db_cost)
    return db_cost

@router.put("/{cost_id}", response_model=schemas.Cost)
def update_cost(
    cost_id: int,
    cost: schemas.CostCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_cost = db.query(company_models.Cost).filter(
        company_models.Cost.id == cost_id
    ).first()
    
    if not db_cost:
        raise HTTPException(status_code=404, detail="Cost not found")
    
    update_data = cost.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cost, key, value)
    
    db_cost.updated_at = datetime.now()
    db.commit()
    db.refresh(db_cost)
    return db_cost

@router.delete("/{cost_id}")
def delete_cost(
    cost_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_cost = db.query(company_models.Cost).filter(
        company_models.Cost.id == cost_id
    ).first()
    
    if not db_cost:
        raise HTTPException(status_code=404, detail="Cost not found")
    
    db.delete(db_cost)
    db.commit()
    return {"message": "Cost deleted successfully"}