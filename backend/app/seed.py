"""
Seeds / synchronizes the Head Admin account.

On every startup:
- Creates the Head Admin if none exists.
- Updates the existing Head Admin email, name and password
  from the current Render environment variables.
"""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole


def seed_head_admin(db: Session) -> None:
    existing = db.query(User).filter(User.role == UserRole.HEAD_ADMIN).first()

    if existing:
        existing.full_name = settings.HEAD_ADMIN_NAME
        existing.email = settings.HEAD_ADMIN_EMAIL
        existing.hashed_password = hash_password(settings.HEAD_ADMIN_PASSWORD)
        existing.is_active = True

        db.commit()

        print(f"[seed] Head Admin synchronized: {settings.HEAD_ADMIN_EMAIL}")
        return

    head_admin = User(
        full_name=settings.HEAD_ADMIN_NAME,
        email=settings.HEAD_ADMIN_EMAIL,
        hashed_password=hash_password(settings.HEAD_ADMIN_PASSWORD),
        role=UserRole.HEAD_ADMIN,
        is_active=True,
    )

    db.add(head_admin)
    db.commit()

    print(f"[seed] Head Admin created: {settings.HEAD_ADMIN_EMAIL}")
