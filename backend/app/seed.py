"""
Seeds the Head Admin account on first run.
Safe to call every startup — it's a no-op if a Head Admin already exists.
"""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole


def seed_head_admin(db: Session) -> None:
    existing = db.query(User).filter(User.role == UserRole.HEAD_ADMIN).first()
    if existing:
        return

    head_admin = User(
        full_name=settings.HEAD_ADMIN_NAME,
        email=settings.HEAD_ADMIN_EMAIL,
        hashed_password=hash_password(settings.HEAD_ADMIN_PASSWORD),
        role=UserRole.HEAD_ADMIN,
    )
    db.add(head_admin)
    db.commit()
    print(f"[seed] Head Admin created: {settings.HEAD_ADMIN_EMAIL}")
