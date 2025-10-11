# backend/scripts/monitor_tunnel.py
"""
Cloudflare Tunnel死活監視スクリプト
5分ごとに実行され、接続できない場合はメール通知
"""
import requests
import sys
import os

sys.path.append(os.path.dirname(__file__))
from send_email import send_alert_email
import system_config as config

def check_tunnel():
    """
    Tunnelの死活監視を実行
    
    Returns:
        bool: 正常ならTrue、異常ならFalse
    """
    try:
        response = requests.get(config.HEALTH_CHECK_ENDPOINT, timeout=config.HEALTH_CHECK_TIMEOUT)
        
        if response.status_code == 200:
            print("✅ Tunnel正常")
            return True
        else:
            print(f"⚠️ Tunnel異常: ステータスコード {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Tunnel応答なし: タイムアウト")
        return False
        
    except requests.exceptions.ConnectionError:
        print("❌ Tunnel接続不可: 接続エラー")
        return False
        
    except Exception as e:
        print(f"❌ Tunnel監視エラー: {e}")
        return False

def main():
    """メイン処理"""
    is_healthy = check_tunnel()
    
    if not is_healthy:
        subject = "⚠️ Cloudflare Tunnel接続異常"
        body = f"""
Cloudflare Tunnelへの接続に失敗しました。

監視URL: {config.HEALTH_CHECK_ENDPOINT}

【確認事項】
1. ラズパイが起動しているか
2. インターネット接続は正常か
3. cloudflaredサービスが動作しているか

【復旧手順】
1. ラズパイにSSH接続
2. sudo systemctl status ecm-tunnel で状態確認
3. sudo systemctl restart ecm-tunnel で再起動

問題が解決しない場合は、ラズパイを再起動してください。
        """
        send_alert_email(subject, body)
        sys.exit(1)
    
    sys.exit(0)

if __name__ == "__main__":
    main()