from sqlalchemy import Column, Integer, String, Date, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from company_database import CompanyBase

# === 工事マスタ（company_id削除済み） ===
class Project(CompanyBase):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)  # 作成ユーザー記録用
    project_code = Column(String, nullable=False)
    period = Column(Integer, nullable=True)  #期
    is_general_expense = Column(Boolean, default=False) # 全体経費フラグ
    name = Column(String, nullable=False)
    client_name = Column(String)
    estimate_number = Column(String)
    contract_amount = Column(Integer, default=0)
    tax_type = Column(String, default="included")
    tax_rate = Column(Integer, default=10)
    status = Column(String, default="active") # active/completed/cancelled/general_expense
    start_date = Column(Date)
    end_date = Column(Date)
    invoice_date = Column(Date)
    payment_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    costs = relationship("Cost", back_populates="project")

# === 原価明細（変更なし） ===
class Cost(CompanyBase):
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
    
    project = relationship("Project", back_populates="costs")

# === 業者マスタ（company_id削除） ===
class Vendor(CompanyBase):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
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

# === カテゴリマスタ（company_id削除） ===
class CostCategory(CompanyBase):
    __tablename__ = "cost_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String)
    display_order = Column(Integer, default=999)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)

# === 顧客マスタ（company_id削除） ===
class Customer(CompanyBase):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    contact_person = Column(String)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


# === 帳票テンプレート設定 ===  ← ★新規追加
class PrintTemplate(CompanyBase):
    __tablename__ = "print_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String, default="工事台帳")
    config = Column(Text)  # JSON形式で保存
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

# === システム設定（期の設定用に修正） ===  ← ★修正
class SystemSettings(CompanyBase):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False)
    value = Column(Text)
    description = Column(Text)
    fiscal_start_year = Column(Integer, default=2000)    # ← ★追加：期の開始年
    fiscal_start_month = Column(Integer, default=8)      # ← ★追加：期の開始月（8月）
    staff_code_digits = Column(Integer, default=3)       # ← ★追加：担当者番号の桁数
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)