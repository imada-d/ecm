# backend/scripts/system_config.py
"""
ECMシステム全体の設定ファイル
環境変数（ENVIRONMENT）によって開発/本番を自動切り替え
"""
import os
import sys

# 親ディレクトリをパスに追加（config.pyをインポートするため）
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# ==================== パス設定 ====================
if ENVIRONMENT == 'production':
    # 本番環境: ラズパイ
    APP_DIR = "/home/pi/ecm/backend"
    BACKUP_DIR = "/mnt/usb_backup/ecm"
    LOG_DIR = "/var/log/ecm"
else:
    # 開発環境: プロジェクトフォルダ
    APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BACKUP_DIR = os.path.join(APP_DIR, "backups")
    LOG_DIR = os.path.join(APP_DIR, "logs")

# ==================== メール設定 ====================
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# 本番環境でのみメール設定を使用
if ENVIRONMENT == 'production':
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'your-gmail@gmail.com')
    SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')
    RECIPIENT_EMAILS = os.getenv('RECIPIENT_EMAILS', '').split(',')
else:
    # 開発環境ではメール送信しない（ログのみ）
    SENDER_EMAIL = "dev@localhost"
    SENDER_PASSWORD = ""
    RECIPIENT_EMAILS = []

SYSTEM_NAME = "ECM原価管理システム"

# ==================== 監視設定 ====================
if ENVIRONMENT == 'production':
    TUNNEL_URL = os.getenv('TUNNEL_URL', 'https://your-domain.com')
else:
    TUNNEL_URL = "http://localhost:8000"

HEALTH_CHECK_ENDPOINT = f"{TUNNEL_URL}/api/health"
HEALTH_CHECK_TIMEOUT = 10

# ==================== バックアップ設定 ====================
BACKUP_RETENTION_DAYS = 30

# ==================== ディスク容量設定 ====================
if ENVIRONMENT == 'production':
    DISK_CHECK_PATHS = ["/", "/mnt/usb_backup"]
else:
    DISK_CHECK_PATHS = ["."]

DISK_WARNING_THRESHOLD_PERCENT = 10

# ==================== Gunicorn設定 ====================
GUNICORN_WORKERS = 3
GUNICORN_BIND = "0.0.0.0:8000"