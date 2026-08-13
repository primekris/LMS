from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class PermissionFlags(BaseModel):
    can_manage_users: bool = False
    can_manage_courses: bool = False
    can_manage_resources: bool = False
    can_manage_enrollments: bool = False
    can_view_reports: bool = False


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    permissions: PermissionFlags | None = None


class CreateModeratorRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    permissions: PermissionFlags = PermissionFlags()


class UpdatePermissionsRequest(BaseModel):
    permissions: PermissionFlags


class PromoteUserRequest(BaseModel):
    role: UserRole
