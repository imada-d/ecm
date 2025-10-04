# backend/scripts/backup.py
"""
DBバックアップスクリプト
毎日深夜3時に自動実行（cronで設定）
"""
import os
import shutil
from datetime import datetime, timedelta
import sys
import system_config as config
from send_email import send_alert_email

def log_info(message):
    """情報ログ出力"""
    print(f"[INFO] {message}")

def log_error(message):
    """エラーログ出力"""
    print(f"[ERROR] {message}")

def log_warning(message):
    """警告ログ出力"""
    print(f"[WARNING] {message}")

def backup_database():
    """データベースバックアップを実行"""
    
    log_info(f"バックアップ開始: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # バックアップディレクトリの存在確認
    if not os.path.exists(config.BACKUP_DIR):
        log_error(f"バックアップディレクトリが存在しません: {config.BACKUP_DIR}")
        log_error("USBドライブがマウントされているか確認してください")
        
        # メール通知
        send_alert_email(
            "❌ バックアップ失敗",
            f"バックアップディレクトリが見つかりません。\n\nパス: {config.BACKUP_DIR}\n\nUSBドライブを確認してください。"
        )
        return False
    
    # タイムスタンプ付きバックアップフォルダ作成
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(config.BACKUP_DIR, f"backup_{timestamp}")
    
    log_info(f"バックアップ先: {backup_path}")
    os.makedirs(backup_path, exist_ok=True)
    
    try:
        # master.dbをバックアップ
        master_db = os.path.join(config.APP_DIR, "master.db")
        if os.path.exists(master_db):
            log_info("master.dbをバックアップ中...")
            shutil.copy2(master_db, backup_path)
            
            # WALファイルもバックアップ
            wal_file = f"{master_db}-wal"
            shm_file = f"{master_db}-shm"
            
            if os.path.exists(wal_file):
                shutil.copy2(wal_file, backup_path)
            if os.path.exists(shm_file):
                shutil.copy2(shm_file, backup_path)
        else:
            log_error("master.dbが見つかりません")
            return False
        
        # dataフォルダをバックアップ
        data_dir = os.path.join(config.APP_DIR, "data")
        if os.path.exists(data_dir):
            log_info("dataフォルダをバックアップ中...")
            shutil.copytree(data_dir, os.path.join(backup_path, "data"))
        else:
            log_warning("dataフォルダが見つかりません（会社がまだ作成されていない可能性）")
        
        # バックアップサイズを計算
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(backup_path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                total_size += os.path.getsize(filepath)
        
        size_mb = total_size / (1024 * 1024)
        log_info(f"バックアップ完了: {size_mb:.2f}MB")
        
        # 古いバックアップを削除
        cleanup_old_backups()
        
        log_info(f"バックアップ処理完了: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return True
        
    except Exception as e:
        log_error(f"バックアップ中にエラーが発生: {e}")
        send_alert_email(
            "❌ バックアップエラー",
            f"バックアップ処理中にエラーが発生しました。\n\nエラー内容:\n{e}"
        )
        return False

def cleanup_old_backups():
    """古いバックアップを削除"""
    log_info(f"古いバックアップを削除中（{config.BACKUP_RETENTION_DAYS}日以前）...")
    
    cutoff_date = datetime.now() - timedelta(days=config.BACKUP_RETENTION_DAYS)
    deleted_count = 0
    
    try:
        for item in os.listdir(config.BACKUP_DIR):
            if not item.startswith("backup_"):
                continue
            
            item_path = os.path.join(config.BACKUP_DIR, item)
            if not os.path.isdir(item_path):
                continue
            
            # 最終更新日時を取得
            mtime = datetime.fromtimestamp(os.path.getmtime(item_path))
            
            if mtime < cutoff_date:
                log_info(f"削除: {item}")
                shutil.rmtree(item_path)
                deleted_count += 1
        
        # 現在のバックアップ数を確認
        backup_count = len([d for d in os.listdir(config.BACKUP_DIR) if d.startswith("backup_")])
        log_info(f"削除数: {deleted_count}, 現在のバックアップ数: {backup_count}")
        
    except Exception as e:
        log_error(f"古いバックアップの削除中にエラー: {e}")

def main():
    """メイン処理"""
    success = backup_database()
    
    if success:
        sys.exit(0)  # 正常終了
    else:
        sys.exit(1)  # 異常終了

if __name__ == "__main__":
    main()