# routers/vendors.py - 会社DB対応完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas
import company_models
from auth_utils import get_current_user

router = APIRouter(prefix="/api/vendors", tags=["業者"])

def get_db(current_user = Depends(get_current_user)):
    """会社DBを取得"""
    from company_database import get_company_session
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[schemas.Vendor])
def get_vendors(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vendors = db.query(company_models.Vendor).filter(
        company_models.Vendor.is_active == True
    ).all()
    return vendors

@router.post("", response_model=schemas.Vendor)
def create_vendor(
    vendor: schemas.VendorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)    
):
    db_vendor = company_models.Vendor(**vendor.dict())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.put("/{vendor_id}", response_model=schemas.Vendor)
def update_vendor(
    vendor_id: int,
    vendor: schemas.VendorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)    
):
    db_vendor = db.query(company_models.Vendor).filter(
        company_models.Vendor.id == vendor_id
    ).first()
    
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    update_data = vendor.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vendor, key, value)
    
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.delete("/{vendor_id}")
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_vendor = db.query(company_models.Vendor).filter(
        company_models.Vendor.id == vendor_id
    ).first()
    
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(db_vendor)
    db.commit()
    return {"message": "Vendor deleted successfully"}