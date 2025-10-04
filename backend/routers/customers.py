# routers/customers.py - 会社DB対応完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import schemas
import company_models
from auth_utils import get_current_user

router = APIRouter(prefix="/api/customers", tags=["顧客"])

def get_db(current_user = Depends(get_current_user)):
    """会社DBを取得"""
    from company_database import get_company_session
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[schemas.Customer])
def get_customers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customers = db.query(company_models.Customer).filter(
        company_models.Customer.is_active == True
    ).all()
    return customers

@router.post("", response_model=schemas.Customer)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_customer = company_models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(
    customer_id: int,
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_customer = db.query(company_models.Customer).filter(
        company_models.Customer.id == customer_id
    ).first()
    
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    
    db_customer.updated_at = datetime.now()
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_customer = db.query(company_models.Customer).filter(
        company_models.Customer.id == customer_id
    ).first()
    
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully"}