from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import UserRole
from app.schemas.user import (
    CreateModeratorRequest,
    PromoteUserRequest,
    UpdatePermissionsRequest,
    UserOut,
)
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["users"])

head_admin_only = require_roles(UserRole.HEAD_ADMIN)


@router.get("", response_model=list[UserOut], dependencies=[Depends(head_admin_only)])
def list_all_users(db: Session = Depends(get_db)):
    return user_service.list_users(db)


@router.get("/export.csv", dependencies=[Depends(head_admin_only)])
def export_users_csv(db: Session = Depends(get_db)):
    users = user_service.list_users(db)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "Full Name", "Email", "Role", "Active", "Created At"])
    for u in users:
        writer.writerow([u.id, u.full_name, u.email, u.role.value, u.is_active, u.created_at.isoformat()])
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )


@router.post("/moderators", response_model=UserOut, status_code=201, dependencies=[Depends(head_admin_only)])
def create_moderator(data: CreateModeratorRequest, db: Session = Depends(get_db)):
    """Only the Head Admin can create moderators and assign their permissions."""
    return user_service.create_moderator(db, data)


@router.patch(
    "/moderators/{user_id}/permissions",
    response_model=UserOut,
    dependencies=[Depends(head_admin_only)],
)
def update_permissions(user_id: int, data: UpdatePermissionsRequest, db: Session = Depends(get_db)):
    return user_service.update_moderator_permissions(db, user_id, data.permissions)


@router.patch("/{user_id}/role", response_model=UserOut, dependencies=[Depends(head_admin_only)])
def promote_user(user_id: int, data: PromoteUserRequest, db: Session = Depends(get_db)):
    """Promote/change an existing user's role."""
    return user_service.promote_user(db, user_id, data.role)


@router.patch("/{user_id}/active", response_model=UserOut, dependencies=[Depends(head_admin_only)])
def set_active(user_id: int, is_active: bool, db: Session = Depends(get_db)):
    """Activate or deactivate a user account."""
    return user_service.set_user_active(db, user_id, is_active)
