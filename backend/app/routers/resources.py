from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.resource import ExternalLinkCreate, ResourceOut
from app.services import resource_service

router = APIRouter(prefix="/api/resources", tags=["resources"])

can_upload = require_roles(UserRole.HEAD_ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR)


@router.post("/upload", response_model=ResourceOut, status_code=201)
def upload_resource(
    lesson_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(can_upload),
):
    return resource_service.upload_file_resource(db, lesson_id, title, file, current_user.id)


@router.post("/link", response_model=ResourceOut, status_code=201)
def add_link(
    data: ExternalLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_upload),
):
    return resource_service.add_external_link_resource(db, data, current_user.id)
