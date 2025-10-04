# 🚨 ECM原価管理システム - 復旧手順書

## 📋 目次

1. [障害の種類と対処法](#障害の種類と対処法)
2. [バックアップからの復旧](#バックアップからの復旧)
3. [予備ラズパイでのセットアップ](#予備ラズパイでのセットアップ)
4. [チェックリスト](#チェックリスト)

---

## 🔍 障害の種類と対処法

### 1. アプリケーションが起動しない

**症状:**
- ブラウザでアクセスできない
- 502 Bad Gateway エラー

**確認方法:**
```bash
# サービスの状態確認
sudo systemctl status ecm

# ログ確認
sudo journalctl -u ecm -n 50
```

**対処法:**
```bash
# サービス再起動
sudo systemctl restart ecm

# それでもダメなら手動起動でエラー確認
sudo systemctl stop ecm
cd /home/pi/ecm/backend
source venv/bin/activate
gunicorn main:app -w 3 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
# ↑エラーメッセージを確認
```

---

### 2. Cloudflare Tunnelが切断

**症状:**
- 外部からアクセスできない
- ローカル(http://localhost:8000)では動いている

**確認方法:**
```bash
# Tunnel状態確認
sudo systemctl status ecm-tunnel

# ログ確認
sudo journalctl -u ecm-tunnel -n 50
```

**対処法:**
```bash
# Tunnel再起動
sudo systemctl restart ecm-tunnel

# 手動実行でテスト
cloudflared tunnel list
cloudflared tunnel run ecm-tunnel
```

---

### 3. データベースエラー

**症状:**
- `database is locked` エラー
- `database disk image is malformed` エラー

**確認方法:**
```bash
# DBファイル確認
ls -lh /home/pi/ecm/backend/master.db*
ls -lh /home/pi/ecm/backend/data/

# SQLiteの整合性チェック
sqlite3 /home/pi/ecm/backend/master.db "PRAGMA integrity_check;"
```

**対処法（軽度）:**
```bash
# アプリ停止
sudo systemctl stop ecm

# WALモード再適用
sqlite3 /home/pi/ecm/backend/master.db "PRAGMA journal_mode=WAL;"

# アプリ起動
sudo systemctl start ecm
```

**対処法（重度・破損している場合）:**
→ [バックアップからの復旧](#バックアップからの復旧)へ

---

### 4. ディスク容量不足

**症状:**
- 書き込みエラー
- バックアップ失敗のメール通知

**確認方法:**
```bash
# ディスク使用量確認
df -h

# 大きなファイルを探す
du -sh /home/pi/ecm/* | sort -h
du -sh /var/log/* | sort -h
```

**対処法:**
```bash
# 古いログ削除
sudo journalctl --vacuum-time=7d

# 古いバックアップ削除（手動で確認しながら）
ls -lh /mnt/usb_backup/ecm/
# 古いものを削除
rm -rf /mnt/usb_backup/ecm/backup_20240101_030000
```

---

### 5. USBバックアップドライブの問題

**症状:**
- バックアップ失敗
- `/mnt/usb_backup` にアクセスできない

**確認方法:**
```bash
# マウント状態確認
mount | grep usb

# USBデバイス確認
lsblk
```

**対処法:**
```bash
# 再マウント
sudo umount /mnt/usb_backup
sudo mount /dev/sda1 /mnt/usb_backup  # デバイス名は lsblk で確認

# fstabに登録されているか確認
cat /etc/fstab
```

---

## 💾 バックアップからの復旧

### 手順1: 復旧スクリプトの実行

```bash
# バックアップUSBがマウントされているか確認
ls /mnt/usb_backup/ecm/

# 復旧スクリプト実行
cd /home/pi/ecm/backend/scripts
python3 restore.py
```

### 手順2: 対話形式で復旧

スクリプトが以下を尋ねてきます：

1. 復旧方法の選択
   - `1` : 最新のバックアップから復旧
   - `2` : バックアップを選択して復旧

2. 確認
   - `yes` と入力して確定

3. サービス停止の案内
   - `sudo systemctl stop ecm` を実行
   - Enterキーを押して続行

### 手順3: 復旧後の確認

```bash
# サービス起動
sudo systemctl start ecm

# 状態確認
sudo systemctl status ecm

# ブラウザでアクセステスト
curl http://localhost:8000
```

---

## 🔄 予備ラズパイでのセットアップ

### 前提条件

- 予備ラズパイにRaspberry Pi OSがインストール済み
- USBバックアップドライブを用意
- ネットワーク接続済み

---

### Step 1: 基本セットアップ

```bash
# システム更新
sudo apt update
sudo apt upgrade -y

# 必要なパッケージインストール
sudo apt install -y python3 python3-pip python3-venv git sqlite3

# piユーザーで作業
cd /home/pi
```

---

### Step 2: アプリケーションの配置

**方法A: GitHubからクローン（推奨）**
```bash
git clone https://github.com/your-repo/ecm.git
cd ecm/backend
```

**方法B: 手動転送**
```bash
# 元のラズパイまたはPCから転送
scp -r /path/to/ecm pi@新ラズパイのIP:/home/pi/
```

---

### Step 3: Python環境構築

```bash
cd /home/pi/ecm/backend

# 仮想環境作成
python3 -m venv venv

# 有効化
source venv/bin/activate

# パッケージインストール
pip install -r requirements.txt
```

---

### Step 4: USBバックアップドライブのマウント

```bash
# USBデバイス確認
lsblk

# マウントポイント作成
sudo mkdir -p /mnt/usb_backup

# マウント（デバイス名は lsblk で確認）
sudo mount /dev/sda1 /mnt/usb_backup

# 自動マウント設定
sudo nano /etc/fstab
# 以下を追加:
# /dev/sda1  /mnt/usb_backup  auto  defaults,nofail  0  2

# 権限設定
sudo chown -R pi:pi /mnt/usb_backup
```

---

### Step 5: 設定ファイルの編集

```bash
cd /home/pi/ecm/backend/scripts

# system_config.py を編集
nano system_config.py
```

**編集内容:**
- `APP_DIR` : `/home/pi/ecm/backend`
- `BACKUP_DIR` : `/mnt/usb_backup/ecm`
- `SENDER_EMAIL` : Gmailアドレス
- `SENDER_PASSWORD` : アプリパスワード
- `RECIPIENT_EMAILS` : 通知先メールアドレス（2つ）
- `TUNNEL_URL` : Cloudflare TunnelのURL

---

### Step 6: バックアップから復旧

```bash
cd /home/pi/ecm/backend/scripts
python3 restore.py

# 最新のバックアップを選択して復旧
```

---

### Step 7: systemdサービス登録

```bash
# サービスファイルをコピー
sudo cp /home/pi/ecm/backend/systemd/*.service /etc/systemd/system/
sudo cp /home/pi/ecm/backend/systemd/*.timer /etc/systemd/system/

# systemd再読み込み
sudo systemctl daemon-reload

# サービス有効化
sudo systemctl enable ecm
sudo systemctl enable ecm-tunnel
sudo systemctl enable ecm-monitor.timer
sudo systemctl enable ecm-disk-check.timer

# サービス起動
sudo systemctl start ecm
sudo systemctl start ecm-tunnel
sudo systemctl start ecm-monitor.timer
sudo systemctl start ecm-disk-check.timer

# 状態確認
sudo systemctl status ecm
sudo systemctl status ecm-tunnel
```

---

### Step 8: cron設定（バックアップ）

```bash
# crontab編集
crontab -e

# 以下を追加:
0 3 * * * /usr/bin/python3 /home/pi/ecm/backend/scripts/backup.py >> /var/log/ecm_backup.log 2>&1
```

---

### Step 9: Cloudflare Tunnel設定

```bash
# cloudflaredインストール
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Cloudflareにログイン
cloudflared tunnel login

# 既存のトンネルを使用（元のラズパイと同じ設定）
cloudflared tunnel route dns ecm-tunnel your-domain.com

# サービス起動
sudo systemctl start ecm-tunnel
```

---

### Step 10: 動作確認

```bash
# ローカルアクセステスト
curl http://localhost:8000

# 外部アクセステスト（別端末から）
curl https://your-tunnel-url.trycloudflare.com

# ログイン確認
# ブラウザで https://your-tunnel-url.trycloudflare.com を開く
```

---

## ✅ チェックリスト

### 日常点検（週1回）

- [ ] バックアップが正常に作成されているか確認
  ```bash
  ls -lh /mnt/usb_backup/ecm/
  ```

- [ ] ディスク容量確認
  ```bash
  df -h
  ```

- [ ] サービス状態確認
  ```bash
  sudo systemctl status ecm
  sudo systemctl status ecm-tunnel
  ```

- [ ] ログ確認
  ```bash
  sudo journalctl -u ecm -n 20
  ```

---

### 月次点検（月1回）

- [ ] バックアップからの復旧テスト（予備機で）

- [ ] メール通知テスト
  ```bash
  cd /home/pi/ecm/backend/scripts
  python3 send_email.py
  ```

- [ ] 監視スクリプト動作確認
  ```bash
  python3 monitor_tunnel.py
  python3 check_disk.py
  ```

- [ ] システムアップデート
  ```bash
  sudo apt update
  sudo apt upgrade
  ```

---

### 緊急連絡先

| 項目 | 情報 |
|------|------|
| システム管理者 | （あなたの連絡先） |
| バックアップ場所 | /mnt/usb_backup/ecm/ |
| サービス名 | ecm, ecm-tunnel |
| Cloudflare Dashboard | https://dash.cloudflare.com/ |

---

## 📞 トラブル時の連絡フロー

1. **まず確認:**
   - メール通知は来ているか
   - サービスは起動しているか（`sudo systemctl status ecm`）

2. **簡易対処:**
   - サービス再起動（`sudo systemctl restart ecm`）
   - ラズパイ再起動（`sudo reboot`）

3. **それでもダメなら:**
   - バックアップから復旧
   - 予備機に切り替え

4. **復旧後:**
   - 原因を調査
   - ログを確認
   - 必要に応じて設定修正

---

## 🔗 関連リンク

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [GitHub Repository](https://github.com/your-repo/ecm)（設定時に追加）
- [システム設定ファイル](/home/pi/ecm/backend/scripts/system_config.py)

---

**最終更新:** 2025年10月4日