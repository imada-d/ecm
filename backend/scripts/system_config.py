# backend/scripts/config.py
"""
ECMシステム全体の設定ファイル
ラズパイ移行時にこのファイルだけを編集すればOK
"""

# ==================== パス設定 ====================
# アプリケーションのルートディレクトリ
APP_DIR = "/home/pi/ecm/backend"

# バックアップ先（USBマウントポイント）
BACKUP_DIR = "/mnt/usb_backup/ecm"

# ログ出力先
LOG_DIR = "/var/log/ecm"

# ==================== メール設定 ====================
# Gmail SMTP設定
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# 送信元Gmail
# ※Googleアカウントで「アプリパスワード」を生成して設定してください
SENDER_EMAIL = "your-gmail@gmail.com"  # ← 変更必須
SENDER_PASSWORD = "xxxx xxxx xxxx xxxx"  # ← 16桁のアプリパスワードに変更

# 通知先メールアドレス（2つ）
RECIPIENT_EMAILS = [
    "recipient1@example.com",  # ← 変更必須
    "recipient2@example.com"   # ← 変更必須
]

# システム名（メール件名に使用）
SYSTEM_NAME = "ECM原価管理システム"

# ==================== 監視設定 ====================
# Cloudflare TunnelのURL
TUNNEL_URL = "https://your-tunnel-url.trycloudflare.com"  # ← 変更必須

# ヘルスチェック用エンドポイント
HEALTH_CHECK_ENDPOINT = f"{TUNNEL_URL}/api/health"

# タイムアウト（秒）
HEALTH_CHECK_TIMEOUT = 10

# ==================== バックアップ設定 ====================
# バックアップ保持日数
BACKUP_RETENTION_DAYS = 30

# ==================== ディスク容量設定 ====================
# 監視対象パス
DISK_CHECK_PATHS = [
    "/",  # ルートパーティション（SDカード）
    "/mnt/usb_backup"  # USBバックアップ
]

# 警告閾値（空き容量がこれ以下でアラート）
DISK_WARNING_THRESHOLD_PERCENT = 10

# ==================== Gunicorn設定 ====================
# ワーカー数
GUNICORN_WORKERS = 3

# バインドアドレス
GUNICORN_BIND = "0.0.0.0:8000"