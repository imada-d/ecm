from sqlalchemy.orm import Session
from database import engine
from models import User
from auth import get_password_hash

# 既存ユーザーのパスワードをリセット
db = Session(bind=engine)
user = db.query(User).filter(User.email == "admin@yourcompany.com").first()
if user:
    user.password_hash = get_password_hash("admin123")
    db.commit()
    print("パスワードをadmin123にリセットしました")
else:
    print("ユーザーが見つかりません")
db.close()