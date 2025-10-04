# backend/scripts/send_email.py
"""
メール送信用の共通関数
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import system_config as config

def send_alert_email(subject, body):
    """
    アラートメールを送信
    
    Args:
        subject (str): 件名
        body (str): 本文
    
    Returns:
        bool: 送信成功ならTrue
    """
    try:
        # メッセージ作成
        msg = MIMEMultipart()
        msg['From'] = config.SENDER_EMAIL
        msg['To'] = ", ".join(config.RECIPIENT_EMAILS)
        msg['Subject'] = f"[{config.SYSTEM_NAME}] {subject}"
        
        # 本文にタイムスタンプ追加
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        full_body = f"{body}\n\n---\n送信日時: {timestamp}"
        
        msg.attach(MIMEText(full_body, 'plain', 'utf-8'))
        
        # SMTP送信
        with smtplib.SMTP(config.SMTP_SERVER, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.SENDER_EMAIL, config.SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ メール送信成功: {subject}")
        return True
        
    except Exception as e:
        print(f"❌ メール送信失敗: {e}")
        return False

# テスト用 & コマンドライン実行用
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) >= 3:
        # コマンドライン引数から件名と本文を取得
        subject = sys.argv[1]
        body = sys.argv[2]
        send_alert_email(subject, body)
    else:
        # テスト送信
        send_alert_email(
            "テスト通知",
            "これはテストメールです。\nメール送信機能が正常に動作しています。"
        )