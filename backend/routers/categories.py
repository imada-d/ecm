# routers/categories.py - 会社DB対応完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas
import company_models
from auth_utils import get_current_user

router = APIRouter(prefix="/api/categories", tags=["カテゴリ"])

def get_db(current_user = Depends(get_current_user)):
    """会社DBを取得"""
    from company_database import get_company_session
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[schemas.Category])
def get_categories(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 会社DBからカテゴリを取得（company_idフィルタ不要）
    categories = db.query(company_models.CostCategory).filter(
        company_models.CostCategory.is_active == True
    ).order_by(company_models.CostCategory.display_order).all()
    return categories

@router.post("", response_model=schemas.Category)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_category = company_models.CostCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int,
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_category = db.query(company_models.CostCategory).filter(
        company_models.CostCategory.id == category_id
    ).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # デフォルトカテゴリは編集制限
    if db_category.is_default:
        raise HTTPException(status_code=403, detail="Cannot edit default category")
    
    update_data = category.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_category = db.query(company_models.CostCategory).filter(
        company_models.CostCategory.id == category_id
    ).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # デフォルトカテゴリは削除不可
    if db_category.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default category")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}