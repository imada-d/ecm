# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

# アプリケーション設定
APP_NAME = "ECM原価管理システム"
APP_VERSION = "1.0.0"
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')  # development/production

# 将来のメール認証用（現在は無効）
ENABLE_EMAIL_VERIFICATION = os.getenv('ENABLE_EMAIL_VERIFICATION', 'false').lower() == 'true'
APP_URL = os.getenv('APP_URL', 'http://localhost:5173')
API_URL = os.getenv('API_URL', 'http://localhost:8000')

# プラン設定
PLANS = {
    "free": {
        "price": 0,
        "max_users": 3,
        "max_projects": 30,
        "storage_limit_mb": 50,
        "data_retention_days": 365
    },
    "paid": {
        "price": 980,
        "max_users": 10,
        "max_projects": 100,
        "storage_limit_mb": 500,
        "data_retention_days": -1
    },
    "premium": {
        "price": 2980,
        "max_users": -1,
        "max_projects": -1,
        "storage_limit_mb": 5000,
        "data_retention_days": -1
    }
}

# メール設定（将来の実装用）
if ENABLE_EMAIL_VERIFICATION:
    SMTP_HOST = os.getenv('SMTP_HOST', '')
    SMTP_PORT = os.getenv('SMTP_PORT', 587)
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASS = os.getenv('SMTP_PASS', '')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@ecm-system.com')