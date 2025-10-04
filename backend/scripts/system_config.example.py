# backend/scripts/system_config.example.py
"""
ECMシステム全体の設定ファイル（テンプレート）
このファイルを system_config.py にコピーして使用してください

使い方:
1. このファイルを system_config.py にコピー
2. 下記の設定値を実際の値に変更
"""

# ==================== パス設定 ====================
APP_DIR = "/home/pi/ecm/backend"  # ラズパイでのパス
BACKUP_DIR = "/mnt/usb_backup/ecm"  # バックアップ先
LOG_DIR = "/var/log/ecm"

# ==================== メール設定 ====================
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# 【変更必須】送信元Gmail
SENDER_EMAIL = "your-gmail@gmail.com"  # ← あなたのGmailに変更
SENDER_PASSWORD = "xxxx xxxx xxxx xxxx"  # ← Googleアプリパスワード（16桁）に変更

# 【変更必須】通知先メールアドレス（2つ）
RECIPIENT_EMAILS = [
    "recipient1@example.com",  # ← 通知先1に変更
    "recipient2@example.com"   # ← 通知先2に変更
]

SYSTEM_NAME = "ECM原価管理システム"

# ==================== 監視設定 ====================
# 【変更必須】Cloudflare TunnelのURL
TUNNEL_URL = "https://your-domain.com"  # ← 実際のURLに変更
HEALTH_CHECK_ENDPOINT = f"{TUNNEL_URL}/api/health"
HEALTH_CHECK_TIMEOUT = 10

# ==================== バックアップ設定 ====================
BACKUP_RETENTION_DAYS = 30

# ==================== ディスク容量設定 ====================
DISK_CHECK_PATHS = [
    "/",
    "/mnt/usb_backup"
]
DISK_WARNING_THRESHOLD_PERCENT = 10

# ==================== Gunicorn設定 ====================
GUNICORN_WORKERS = 3
GUNICORN_BIND = "0.0.0.0:8000"