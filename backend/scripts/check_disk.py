# backend/scripts/check_disk.py
"""
ディスク容量監視スクリプト
毎日1回実行され、空き容量が10%以下の場合はメール通知
"""
import shutil
import sys
import os
from send_email import send_alert_email
import system_config as config

def check_disk_usage(path):
    """
    指定パスのディスク使用率をチェック
    
    Args:
        path (str): チェック対象パス
    
    Returns:
        dict: 使用状況の辞書
    """
    try:
        stat = shutil.disk_usage(path)
        total_gb = stat.total / (1024**3)
        used_gb = stat.used / (1024**3)
        free_gb = stat.free / (1024**3)
        percent_used = (stat.used / stat.total) * 100
        percent_free = 100 - percent_used
        
        return {
            "path": path,
            "total_gb": total_gb,
            "used_gb": used_gb,
            "free_gb": free_gb,
            "percent_free": percent_free,
            "is_low": percent_free <= config.DISK_WARNING_THRESHOLD_PERCENT
        }
    except Exception as e:
        print(f"❌ {path} のチェックに失敗: {e}")
        return None

def main():
    """メイン処理"""
    low_disk_warnings = []
    
    for path in config.DISK_CHECK_PATHS:
        if not os.path.exists(path):
            print(f"⚠️ パスが存在しません: {path}")
            continue
        
        result = check_disk_usage(path)
        if result is None:
            continue
        
        print(f"📊 {result['path']}: {result['free_gb']:.2f}GB空き ({result['percent_free']:.1f}%)")
        
        if result['is_low']:
            low_disk_warnings.append(result)
    
    if low_disk_warnings:
        subject = "⚠️ ディスク容量不足警告"
        body = f"以下のディスクで空き容量が{config.DISK_WARNING_THRESHOLD_PERCENT}%以下になっています。\n\n"
        
        for result in low_disk_warnings:
            body += f"【{result['path']}】\n"
            body += f"  合計容量: {result['total_gb']:.2f}GB\n"
            body += f"  使用容量: {result['used_gb']:.2f}GB\n"
            body += f"  空き容量: {result['free_gb']:.2f}GB ({result['percent_free']:.1f}%)\n\n"
        
        body += f"""
【対処方法】
1. 古いバックアップファイルを削除
2. ログファイルをクリーンアップ
3. 不要なファイルを削除

※バックアップは{config.BACKUP_RETENTION_DAYS}日以上前のものが自動削除されます
        """
        
        send_alert_email(subject, body)
        sys.exit(1)
    
    print("✅ ディスク容量は正常です")
    sys.exit(0)

if __name__ == "__main__":
    main()