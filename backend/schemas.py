# backend/schemas.py - 完全版（username統一版）
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

# === 認証・会社関連スキーマ ===
# 会社関連
class CompanyBase(BaseModel):
    name: str
    plan_type: Optional[str] = "free"
    max_users: Optional[int] = 1

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# ユーザー関連
class UserBase(BaseModel):
    username: str  # ← emailからusernameに変更
    name: str
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str
    company_id: Optional[int] = None

class UserLogin(BaseModel):
    company_code: str
    username: str
    password: str

class User(UserBase):
    id: int
    company_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

# トークンレスポンス
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User
    company: Company


# 工事関連スキーマ
class ProjectBase(BaseModel):
    project_code: str
    name: str
    client_name: Optional[str] = None
    estimate_number: Optional[str] = None
    contract_amount: Optional[int] = 0
    tax_type: Optional[str] = "included"
    tax_rate: Optional[int] = 10
    status: Optional[str] = "active"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    invoice_date: Optional[date] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_code: Optional[str] = None
    name: Optional[str] = None
    is_general_expense: Optional[bool] = False
    client_name: Optional[str] = None
    estimate_number: Optional[str] = None
    contract_amount: Optional[int] = None
    tax_type: Optional[str] = None
    tax_rate: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    invoice_date: Optional[date] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None

class Project(ProjectBase):
    id: int
    period: Optional[int] = None
    is_general_expense: Optional[bool] = False
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# 原価関連スキーマ
class CostBase(BaseModel):
    project_id: int
    date: date
    vendor: str
    description: Optional[str] = None
    amount: int
    tax_type: Optional[str] = "included"
    tax_amount: Optional[int] = 0
    total_amount: int
    category: Optional[str] = "材料費"
    payment_status: Optional[str] = "unpaid"
    payment_date: Optional[date] = None

class CostCreate(CostBase):
    pass

class CostUpdate(CostBase):
    project_id: Optional[int] = None
    date: Optional[date] = None
    vendor: Optional[str] = None
    amount: Optional[int] = None
    total_amount: Optional[int] = None

class Cost(CostBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# 業者関連スキーマ
class VendorBase(BaseModel):
    name: str
    category: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    default_tax_type: Optional[str] = "included"
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = True
    is_favorite: Optional[bool] = False

class VendorCreate(VendorBase):
    pass

class Vendor(VendorBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# カテゴリ関連スキーマ
class CategoryBase(BaseModel):
    name: str
    color: Optional[str] = None
    display_order: Optional[int] = 999
    is_default: Optional[bool] = False
    is_active: Optional[bool] = True

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# 顧客関連スキーマ
class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    name: Optional[str] = None

class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# システム設定関連スキーマ
class SystemSettingsBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SystemSettingsCreate(SystemSettingsBase):
    pass

class SystemSettingsUpdate(BaseModel):
    value: str

class SystemSettings(SystemSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# 帳票テンプレート関連スキーマ
class PrintTemplateBase(BaseModel):
    template_name: Optional[str] = "工事台帳"
    config: Optional[str] = None  # JSON文字列

class PrintTemplateCreate(PrintTemplateBase):
    pass

class PrintTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    config: Optional[str] = None

class PrintTemplate(PrintTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# 会社登録用（将来のWeb公開時用）
class CompanyRegister(BaseModel):
    company_name: str
    email: str
    admin_username: str
    admin_password: str
    plan_type: Optional[str] = "free"