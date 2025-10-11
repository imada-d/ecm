from sqlalchemy import Column, Integer, String, Date, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# === 会社マスタ ===
class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    plan_type = Column(String, default="free")  # free/paid
    max_users = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    users = relationship("User", back_populates="company")
    projects = relationship("Project", back_populates="company")

# === 利用者マスタ ===
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)  # 実際はユーザーIDとして使用
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # admin/user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    company = relationship("Company", back_populates="users")
    projects = relationship("Project", back_populates="user")

# === 工事マスタ ===
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    project_code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    client_name = Column(String)
    estimate_number = Column(String)
    contract_amount = Column(Integer, default=0)
    tax_type = Column(String, default="included")
    tax_rate = Column(Integer, default=10)
    status = Column(String, default="active")
    start_date = Column(Date)
    end_date = Column(Date)
    invoice_date = Column(Date)
    payment_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    costs = relationship("Cost", back_populates="project")
    user = relationship("User", back_populates="projects")
    company = relationship("Company", back_populates="projects")

# === 原価明細 ===
class Cost(Base):
    __tablename__ = "costs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    date = Column(Date, nullable=False)
    vendor = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(Integer, nullable=False)
    tax_type = Column(String, default="included")
    tax_amount = Column(Integer, default=0)
    total_amount = Column(Integer, nullable=False)
    category = Column(String, default="材料費")
    payment_status = Column(String, default="unpaid")
    payment_date = Column(Date)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    project = relationship("Project", back_populates="costs")

# === 業者マスタ ===
class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)
    phone = Column(String)
    email = Column(String)
    default_tax_type = Column(String, default="included")
    payment_terms = Column(String)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

# === カテゴリマスタ ===
class CostCategory(Base):
    __tablename__ = "cost_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    name = Column(String, nullable=False)
    color = Column(String)
    display_order = Column(Integer, default=999)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)

# === 顧客マスタ ===
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    contact_person = Column(String)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

# === システム設定 ===
class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    key = Column(String, nullable=False)
    value = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)