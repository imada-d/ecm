# routers/dashboard.py - 会社DB対応完全版
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime
import schemas
import company_models
from auth_utils import get_current_user

router = APIRouter(prefix="/api", tags=["ダッシュボード"])

def get_db(current_user = Depends(get_current_user)):
    """会社DBを取得"""
    from company_database import get_company_session
    db = get_company_session(current_user.company_id)
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 進行中のプロジェクト数
    active_projects = db.query(company_models.Project).filter(
        company_models.Project.status == "active"
    ).count()
    
    # 今月の原価合計
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    return {
        "active_projects": active_projects,
        "current_month": f"{current_year}年{current_month}月",
        "message": "ダッシュボードデータ"
    }

@router.get("/dashboard/summary")
def get_dashboard_summary(
    period_type: Optional[str] = "current",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    view_scope: Optional[str] = None,  # 'my' または None
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 期の設定を取得
    fiscal_month_setting = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == "fiscal_year_start_month"
    ).first()
    
    current_period_setting = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == "current_fiscal_period"
    ).first()
    
    fiscal_month = int(fiscal_month_setting.value) if fiscal_month_setting else 8
    current_period = int(current_period_setting.value) if current_period_setting else 1
    
    # 未請求の定義設定を取得
    unbilled_setting = db.query(company_models.SystemSettings).filter(
        company_models.SystemSettings.key == "unbilled_definition"
    ).first()
    unbilled_type = unbilled_setting.value if unbilled_setting else "completed"
    
    # 現在の日付から期の開始・終了日を計算
    today = date.today()
    current_year = today.year
    
    # 期の開始日を計算
    if today.month < fiscal_month:
        period_start_year = current_year - 1
    else:
        period_start_year = current_year
    
    if period_type == "current":
        start = date(period_start_year, fiscal_month, 1)
        if fiscal_month == 1:
            end = date(period_start_year, 12, 31)
        else:
            end = date(period_start_year + 1, fiscal_month - 1, 31)
    elif period_type == "previous":
        start = date(period_start_year - 1, fiscal_month, 1)
        if fiscal_month == 1:
            end = date(period_start_year - 1, 12, 31)
        else:
            end = date(period_start_year, fiscal_month - 1, 31)
    elif period_type == "custom" and start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
    else:
        start = date(2000, 1, 1)
        end = date(2100, 12, 31)
    
# プロジェクトの集計
    projects_query = db.query(company_models.Project)
    
    # view_scope='my' または 管理者以外は自分のデータのみ
    if view_scope == "my" or current_user.role != "admin":
        projects_query = projects_query.filter(
            company_models.Project.user_id == current_user.id
        )
        from sqlalchemy import or_, and_
        # 全体経費または日付範囲内のプロジェクト
        projects_query = projects_query.filter(
            or_(
                company_models.Project.is_general_expense == True,
                and_(company_models.Project.start_date >= start, company_models.Project.start_date <= end),
                and_(company_models.Project.end_date >= start, company_models.Project.end_date <= end),
                and_(company_models.Project.start_date <= start, 
                     or_(company_models.Project.end_date >= end, company_models.Project.end_date == None))
            )
        )
    
    projects = projects_query.all()
    project_ids = [p.id for p in projects]
    
    # 原価の集計
    costs_query = db.query(
        func.sum(company_models.Cost.amount).label("total_cost"),
        func.count(company_models.Cost.id).label("cost_count"),
        company_models.Cost.category
    ).filter(
        company_models.Cost.project_id.in_(project_ids),
        company_models.Cost.date >= start,
        company_models.Cost.date <= end
    ).group_by(company_models.Cost.category)
    
    costs_by_category = costs_query.all()
    
    # 集計データを計算
    total_contract = sum([p.contract_amount or 0 for p in projects])
    total_cost = sum([c.total_cost or 0 for c in costs_by_category])
    gross_profit = total_contract - total_cost
    gross_profit_rate = (gross_profit / total_contract * 100) if total_contract > 0 else 0
    
    # カテゴリ別の内訳
    category_breakdown = {}
    for cost in costs_by_category:
        category_breakdown[cost.category] = cost.total_cost or 0
    
    # プロジェクトのステータス別カウント
    active_projects = len([p for p in projects if p.status == "active"])
    completed_projects = len([p for p in projects if p.status == "completed"])
    
    # 未請求・未入金を計算
    unbilled_projects = []
    unpaid_projects = []
    
    for project in projects:

        # 全体経費は未請求・未入金の対象外
        if project.is_general_expense:
            continue

        # 未請求判定
        is_unbilled = False
        if unbilled_type == "active" and project.status == "active" and not project.invoice_date:
            is_unbilled = True
        elif unbilled_type == "completed" and project.status == "completed" and not project.invoice_date:
            is_unbilled = True
        elif unbilled_type == "overdue" and project.end_date and project.end_date < today and not project.invoice_date:
            is_unbilled = True
            
        if is_unbilled:
            unbilled_projects.append(project)
        
        # 未入金判定（請求済みだが入金日なし）
        if project.invoice_date and not project.payment_date:
            unpaid_projects.append(project)
    
    # 未請求・未入金のプロジェクト詳細を含める
    unbilled_details = []
    for p in unbilled_projects:
        unbilled_details.append({
            "id": p.id,
            "project_code": p.project_code,
            "name": p.name,
            "client_name": p.client_name,
            "contract_amount": p.contract_amount or 0,
            "status": p.status,
            "end_date": p.end_date.isoformat() if p.end_date else None
        })
    
    unpaid_details = []
    for p in unpaid_projects:
        unpaid_details.append({
            "id": p.id,
            "project_code": p.project_code,
            "name": p.name,
            "client_name": p.client_name,
            "contract_amount": p.contract_amount or 0,
            "invoice_date": p.invoice_date.isoformat() if p.invoice_date else None
        })
    
    return {
        "period_info": {
            "type": period_type,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "current_period": current_period,
            "fiscal_month": fiscal_month
        },
        "summary": {
            "total_contract": total_contract,
            "total_cost": total_cost,
            "gross_profit": gross_profit,
            "gross_profit_rate": round(gross_profit_rate, 1)
        },
        "projects": {
            "active": active_projects,
            "completed": completed_projects,
            "total": len(projects)
        },
        "cost_breakdown": category_breakdown,
        "unbilled": {
            "count": len(unbilled_projects),
            "total": sum([p.contract_amount or 0 for p in unbilled_projects]),
            "projects": unbilled_details
        },
        "unpaid": {
            "count": len(unpaid_projects),
            "total": sum([p.contract_amount or 0 for p in unpaid_projects]),
            "projects": unpaid_details
        },
        "period_display": f"第{current_period}期" if period_type == "current" else 
                         f"第{current_period - 1}期" if period_type == "previous" else 
                         "全期間"
    }


# 全体統計API（管理者用）
@router.get("/dashboard/all")
def get_all_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="権限がありません")
    
    # 全プロジェクトを取得
    all_projects = db.query(company_models.Project).all()
    
    # 進行中のプロジェクト（全体経費を除外）
    active_projects_query = db.query(company_models.Project).filter(
        company_models.Project.status == "active",
        company_models.Project.is_general_expense != True
    ).all()
    
    # master_databaseからユーザー情報を取得
    from master_database import MasterSessionLocal, User
    master_db = MasterSessionLocal()
    
    # active_projectsを辞書形式に変換
    active_projects = []
    for p in active_projects_query:
        # 担当者情報を取得
        user = master_db.query(User).filter(User.id == p.user_id).first()
        user_name = user.name if user else "不明"
        
        active_projects.append({
            "id": p.id,
            "project_code": p.project_code,
            "name": p.name,
            "contract_amount": p.contract_amount or 0,
            "client_name": p.client_name,
            "user_name": user_name  # 追加
        })
    
    master_db.close()
    
    # 全体の受注額を計算
    total_amount = sum(p.contract_amount or 0 for p in all_projects)
    
    # 全プロジェクトの原価合計
    project_ids = [p.id for p in all_projects]
    total_cost = db.query(func.sum(company_models.Cost.amount)).filter(
        company_models.Cost.project_id.in_(project_ids)
    ).scalar() or 0 if project_ids else 0
    
    # 粗利益と粗利率
    gross_profit = total_amount - total_cost
    profit_rate = (gross_profit / total_amount * 100) if total_amount > 0 else 0
    
    return {
        "total_projects": len(all_projects),
        "total_amount": total_amount,
        "total_cost": total_cost,
        "gross_profit": gross_profit,
        "profit_rate": profit_rate,
        "active_projects": active_projects
    }


# 自分の統計API
@router.get("/dashboard/my")
def get_my_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 自分のプロジェクト
    my_projects = db.query(company_models.Project).filter(
        company_models.Project.user_id == current_user.id
    ).all()
    
    # active_projectsを辞書形式に変換
    active_projects_list = [p for p in my_projects if p.status == "active"]
    active_projects = []
    for p in active_projects_list:
        active_projects.append({
            "id": p.id,
            "project_code": p.project_code,
            "name": p.name,
            "contract_amount": p.contract_amount or 0,
            "client_name": p.client_name
        })
    completed_projects = [p for p in my_projects if p.status == "completed"][:5]
    
    total_amount = sum(p.contract_amount or 0 for p in my_projects)
    
    project_ids = [p.id for p in my_projects]
    total_cost = db.query(func.sum(company_models.Cost.amount)).filter(
        company_models.Cost.project_id.in_(project_ids)
    ).scalar() or 0 if project_ids else 0
    
    gross_profit = total_amount - total_cost
    profit_rate = (gross_profit / total_amount * 100) if total_amount > 0 else 0
    
    # 今月のデータ
    today = datetime.now()
    month_start = today.replace(day=1)
    
    monthly_projects = db.query(company_models.Project).filter(
        company_models.Project.user_id == current_user.id,
        company_models.Project.created_at >= month_start
    ).count()
    
    monthly_costs = db.query(company_models.Cost).filter(
        company_models.Cost.project_id.in_(project_ids),
        company_models.Cost.created_at >= month_start  
    ).count()
    
    monthly_amount = db.query(func.sum(company_models.Project.contract_amount)).filter(
        company_models.Project.user_id == current_user.id,
        company_models.Project.created_at >= month_start
    ).scalar() or 0
    
    return {
        "total_amount": total_amount,
        "total_cost": total_cost,
        "gross_profit": gross_profit,
        "profit_rate": profit_rate,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "monthly_projects": monthly_projects,
        "monthly_costs": monthly_costs,
        "monthly_amount": monthly_amount
    }

# ユーザー別統計API
@router.get("/dashboard/users")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="権限がありません")
    
    from master_database import MasterSessionLocal, User
    master_db = MasterSessionLocal()
    
    company_users = master_db.query(User).filter(
        User.company_id == current_user.company_id
    ).all()
    
    user_stats = []
    for user in company_users:
        projects = db.query(company_models.Project).filter(
            company_models.Project.user_id == user.id
        ).all()
        
        project_count = len(projects)
        total_amount = sum(p.contract_amount or 0 for p in projects)
        
        project_ids = [p.id for p in projects]
        total_cost = db.query(func.sum(company_models.Cost.amount)).filter(
            company_models.Cost.project_id.in_(project_ids)
        ).scalar() or 0 if project_ids else 0
        
        profit_rate = ((total_amount - total_cost) / total_amount * 100) if total_amount > 0 else 0
        
        user_stats.append({
            "user_id": user.id,
            "user_name": user.name,
            "project_count": project_count,
            "total_amount": total_amount,
            "profit_rate": profit_rate
        })
    
    master_db.close()
    
    return user_stats