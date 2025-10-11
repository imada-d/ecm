# ECM 原価管理システム

電気工事業向けの原価管理システム（マルチテナント対応）

## 機能

- マルチテナント対応（会社別DB分離）
- 16種類の権限管理
- 工事台帳・原価管理
- 取引先管理（業者・顧客）
- ダッシュボード統計
- 期の管理
- 全体経費機能

## 技術スタック

- **フロントエンド**: React (Vite) + TailwindCSS v3.4.0
- **バックエンド**: FastAPI + SQLAlchemy + SQLite
- **本番環境**: Raspberry Pi + Gunicorn + Cloudflare Tunnel

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/imada-d/ecm.git
cd ecm
```

### 2. 設定ファイルの準備

```bash
cd backend/scripts
cp system_config.example.py system_config.py
nano system_config.py  # 実際の値に編集
```

**重要:** `system_config.py` は機密情報を含むため、Gitにコミットしないでください。

### 3. 開発環境での起動

**バックエンド:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**フロントエンド:**
```bash
cd frontend
npm install
npm run dev
```

## ドキュメント

- [復旧手順書](backend/docs/recovery.md)
- [ラズパイ移行チェックリスト](backend/ラズパイ移行チェックリスト.txt)

## 本番環境デプロイ

詳細は[ラズパイ移行チェックリスト](backend/ラズパイ移行チェックリスト.txt)を参照。

### 概要

1. ラズパイ4にRaspberry Pi OS をインストール
2. リポジトリをクローン
3. system_config.py を編集（メール設定、Tunnel URLなど）
4. systemdサービスを登録
5. Cloudflare Tunnelを設定
6. 自動バックアップを設定（cron）

## 運用

### 自動化されている機能

- **バックアップ**: 毎日3:00に自動実行（USBドライブに保存）
- **Tunnel監視**: 5分ごとに死活監視（異常時メール通知）
- **ディスク容量監視**: 毎日4:00にチェック（10%以下でメール通知）
- **アプリ自動再起動**: クラッシュ時に5秒後に自動復旧

### メンテナンス

- **週次**: バックアップとディスク容量の確認
- **月次**: システムアップデートと復旧テスト

## ライセンス

個人利用