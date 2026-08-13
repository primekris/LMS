from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.services import stats_service

router = APIRouter(prefix="/api/stats", tags=["stats"])

staff_only = require_roles(UserRole.HEAD_ADMIN, UserRole.MODERATOR)


@router.get("/users")
def get_user_stats(db: Session = Depends(get_db), _: User = Depends(staff_only)):
    return stats_service.user_stats(db)


@router.get("/courses")
def get_course_stats(db: Session = Depends(get_db), _: User = Depends(staff_only)):
    return stats_service.course_stats(db)
