# backend/scripts/restore.py
"""
バックアップから復旧するスクリプト
"""
import os
import shutil
from datetime import datetime
import sys
import system_config as config

def log_info(message):
    """情報ログ出力"""
    print(f"\033[0;32m[INFO]\033[0m {message}")

def log_error(message):
    """エラーログ出力"""
    print(f"\033[0;31m[ERROR]\033[0m {message}")

def find_latest_backup():
    """最新のバックアップフォルダを探す"""
    try:
        backups = []
        for item in os.listdir(config.BACKUP_DIR):
            if item.startswith("backup_"):
                item_path = os.path.join(config.BACKUP_DIR, item)
                if os.path.isdir(item_path):
                    mtime = os.path.getmtime(item_path)
                    backups.append((item_path, mtime))
        
        if not backups:
            return None
        
        # 最新のものを返す
        backups.sort(key=lambda x: x[1], reverse=True)
        return backups[0][0]
        
    except Exception as e:
        log_error(f"バックアップの検索中にエラー: {e}")
        return None

def list_backups():
    """利用可能なバックアップを一覧表示"""
    try:
        backups = []
        for item in os.listdir(config.BACKUP_DIR):
            if item.startswith("backup_"):
                item_path = os.path.join(config.BACKUP_DIR, item)
                if os.path.isdir(item_path):
                    mtime = datetime.fromtimestamp(os.path.getmtime(item_path))
                    backups.append((item, mtime))
        
        if not backups:
            log_error("バックアップが見つかりません")
            return []
        
        backups.sort(key=lambda x: x[1], reverse=True)
        
        print("\n利用可能なバックアップ:")
        for i, (name, mtime) in enumerate(backups, 1):
            print(f"  {i}. {name} ({mtime.strftime('%Y-%m-%d %H:%M:%S')})")
        
        return backups
        
    except Exception as e:
        log_error(f"バックアップの一覧取得中にエラー: {e}")
        return []

def restore_from_backup(backup_path):
    """指定されたバックアップから復旧"""
    log_info(f"バックアップから復旧: {backup_path}")
    
    # 確認
    print("\n⚠️  警告: 現在のデータは上書きされます。")
    confirm = input("本当に復旧しますか？ (yes/no): ")
    
    if confirm.lower() != "yes":
        log_info("キャンセルしました")
        return False
    
    try:
        # サービス停止の案内
        print("\n復旧を開始する前に、以下のコマンドでサービスを停止してください:")
        print("  sudo systemctl stop ecm")
        input("\nサービスを停止したらEnterを押してください...")
        
        # master.dbを復旧
        log_info("master.dbを復旧中...")
        master_src = os.path.join(backup_path, "master.db")
        master_dst = os.path.join(config.APP_DIR, "master.db")
        
        if os.path.exists(master_src):
            shutil.copy2(master_src, master_dst)
            
            # WALファイルも復旧
            wal_src = os.path.join(backup_path, "master.db-wal")
            shm_src = os.path.join(backup_path, "master.db-shm")
            
            if os.path.exists(wal_src):
                shutil.copy2(wal_src, os.path.join(config.APP_DIR, "master.db-wal"))
            if os.path.exists(shm_src):
                shutil.copy2(shm_src, os.path.join(config.APP_DIR, "master.db-shm"))
        else:
            log_error("バックアップにmaster.dbが見つかりません")
            return False
        
        # dataフォルダを復旧
        log_info("dataフォルダを復旧中...")
        data_src = os.path.join(backup_path, "data")
        data_dst = os.path.join(config.APP_DIR, "data")
        
        if os.path.exists(data_src):
            # 既存のdataフォルダを削除
            if os.path.exists(data_dst):
                shutil.rmtree(data_dst)
            shutil.copytree(data_src, data_dst)
        else:
            log_error("バックアップにdataフォルダが見つかりません")
        
        log_info("復旧完了！")
        print("\n次のステップ:")
        print("  1. sudo systemctl start ecm でサービスを起動")
        print("  2. sudo systemctl status ecm でステータス確認")
        
        return True
        
    except Exception as e:
        log_error(f"復旧中にエラーが発生: {e}")
        return False

def main():
    """メイン処理"""
    print("=" * 60)
    print("  ECM バックアップ復旧ツール")
    print("=" * 60)
    
    # バックアップ一覧表示
    backups = list_backups()
    if not backups:
        sys.exit(1)
    
    # 選択
    print("\n復旧方法を選択:")
    print("  1. 最新のバックアップから復旧")
    print("  2. バックアップを選択して復旧")
    print("  0. キャンセル")
    
    choice = input("\n選択 (0-2): ")
    
    if choice == "0":
        log_info("キャンセルしました")
        sys.exit(0)
    elif choice == "1":
        latest = find_latest_backup()
        if latest:
            success = restore_from_backup(latest)
        else:
            log_error("最新のバックアップが見つかりません")
            success = False
    elif choice == "2":
        try:
            idx = int(input("バックアップ番号を入力: ")) - 1
            if 0 <= idx < len(backups):
                backup_name = backups[idx][0]
                backup_path = os.path.join(config.BACKUP_DIR, backup_name)
                success = restore_from_backup(backup_path)
            else:
                log_error("無効な番号です")
                success = False
        except ValueError:
            log_error("数字を入力してください")
            success = False
    else:
        log_error("無効な選択です")
        success = False
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()