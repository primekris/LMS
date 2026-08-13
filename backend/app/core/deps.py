"""
Shared FastAPI dependencies: extracting the current user from a JWT, and
role / permission guards used to protect routes (RBAC).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_error
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except ValueError as exc:
        raise credentials_error from exc

    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        raise credentials_error
    return user


def require_roles(*allowed_roles: UserRole):
    """Dependency factory: only allow the given roles through."""

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return _checker


def require_permission(permission_name: str):
    """
    Dependency factory for Moderator fine-grained permissions.
    Head Admin always passes. Moderators must have the named flag set on
    their ModeratorPermission row. All other roles are denied.
    """

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.HEAD_ADMIN:
            return current_user
        if current_user.role == UserRole.MODERATOR and current_user.permissions:
            if getattr(current_user.permissions, permission_name, False):
                return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action",
        )

    return _checker
