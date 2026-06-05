from app.core.database import SessionLocal
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User, Role

def seed():
    if not settings.FIRST_SUPERADMIN_EMAIL or not settings.FIRST_SUPERADMIN_PASSWORD:
        raise RuntimeError("Set FIRST_SUPERADMIN_EMAIL and FIRST_SUPERADMIN_PASSWORD before running seed.py")
    db = SessionLocal()
    existing = db.query(User).filter(User.email == settings.FIRST_SUPERADMIN_EMAIL).first()
    if not existing:
        admin = User(
            email=settings.FIRST_SUPERADMIN_EMAIL,
            hashed_password=hash_password(settings.FIRST_SUPERADMIN_PASSWORD),
            full_name="Super Admin",
            role=Role.superadmin,
            tenant_id=None,
        )
        db.add(admin)
        db.commit()
        print(f"Superadmin created: {settings.FIRST_SUPERADMIN_EMAIL}")
    else:
        print("Superadmin already exists")
    db.close()

if __name__ == "__main__":
    seed()
