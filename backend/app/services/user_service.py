from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import ModeratorPermission, User, UserRole
from app.schemas.user import CreateModeratorRequest, PermissionFlags


def create_moderator(db: Session, data: CreateModeratorRequest) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=UserRole.MODERATOR,
    )
    db.add(user)
    db.flush()  # get user.id before creating the permissions row

    perms = ModeratorPermission(user_id=user.id, **data.permissions.model_dump())
    db.add(perms)
    db.commit()
    db.refresh(user)
    return user


def update_moderator_permissions(db: Session, user_id: int, permissions: PermissionFlags) -> User:
    user = db.get(User, user_id)
    if not user or user.role != UserRole.MODERATOR:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Moderator not found")

    if not user.permissions:
        user.permissions = ModeratorPermission(user_id=user.id)

    for field, value in permissions.model_dump().items():
        setattr(user.permissions, field, value)

    db.commit()
    db.refresh(user)
    return user


def promote_user(db: Session, user_id: int, new_role: UserRole) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role == UserRole.HEAD_ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change the Head Admin's role")

    user.role = new_role
    if new_role == UserRole.MODERATOR and not user.permissions:
        user.permissions = ModeratorPermission(user_id=user.id)

    db.commit()
    db.refresh(user)
    return user


def set_user_active(db: Session, user_id: int, is_active: bool) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role == UserRole.HEAD_ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate the Head Admin")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()
