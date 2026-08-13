from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.progress import CourseProgressOut
from app.services import progress_service

router = APIRouter(prefix="/api/progress", tags=["progress"])

student_only = require_roles(UserRole.STUDENT)


@router.post("/lessons/{lesson_id}/complete", response_model=CourseProgressOut)
def mark_lesson_complete(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(student_only)):
    from app.services.progress_service import _course_id_for_lesson

    course_id = _course_id_for_lesson(db, lesson_id)
    progress_service.mark_lesson_complete(db, current_user.id, lesson_id)
    return progress_service.get_course_progress(db, current_user.id, course_id)


@router.get("/courses/{course_id}", response_model=CourseProgressOut)
def course_progress(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(student_only)):
    return progress_service.get_course_progress(db, current_user.id, course_id)
