from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, require_roles
from app.models.user import User, UserRole
from app.schemas.course import (
    CategoryCreate,
    CategoryOut,
    CourseCreate,
    CourseOut,
    CourseSummaryOut,
    LessonCreate,
    LessonOut,
    ModuleCreate,
    ModuleOut,
)
from app.services import course_service

router = APIRouter(prefix="/api/courses", tags=["courses"])

can_manage_courses = require_permission("can_manage_courses")
instructor_or_admin = require_roles(UserRole.HEAD_ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR)


@router.get("", response_model=list[CourseSummaryOut])
def list_courses(
    category_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Students/Donors only see published courses; staff sees everything.
    published_only = current_user.role in (UserRole.STUDENT, UserRole.DONOR)
    return course_service.list_courses(db, published_only=published_only, category_id=category_id)


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return course_service.list_categories(db)


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(instructor_or_admin)):
    return course_service.create_category(db, data.name)


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    return course_service.get_course_or_404(db, course_id)


@router.post("", response_model=CourseOut, status_code=201)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(instructor_or_admin),
):
    return course_service.create_course(db, instructor_id=current_user.id, data=data)


@router.post("/{course_id}/publish", response_model=CourseOut)
def publish_course(course_id: int, db: Session = Depends(get_db), _: User = Depends(instructor_or_admin)):
    return course_service.set_published(db, course_id, published=True)


@router.post("/{course_id}/unpublish", response_model=CourseOut)
def unpublish_course(course_id: int, db: Session = Depends(get_db), _: User = Depends(instructor_or_admin)):
    return course_service.set_published(db, course_id, published=False)


@router.post("/{course_id}/modules", response_model=ModuleOut, status_code=201)
def add_module(
    course_id: int,
    data: ModuleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(instructor_or_admin),
):
    return course_service.add_module(db, course_id, data)


@router.post("/modules/{module_id}/lessons", response_model=LessonOut, status_code=201)
def add_lesson(
    module_id: int,
    data: LessonCreate,
    db: Session = Depends(get_db),
    _: User = Depends(instructor_or_admin),
):
    return course_service.add_lesson(db, module_id, data)


@router.get("/{course_id}/enrollments")
def list_course_enrollments(course_id: int, db: Session = Depends(get_db), _: User = Depends(instructor_or_admin)):
    from app.models.enrollment import Enrollment
    from app.models.user import User as UserModel

    rows = (
        db.query(Enrollment.id, UserModel.id, UserModel.full_name, UserModel.email)
        .join(UserModel, UserModel.id == Enrollment.student_id)
        .filter(Enrollment.course_id == course_id)
        .all()
    )
    return [{"enrollment_id": r[0], "student_id": r[1], "full_name": r[2], "email": r[3]} for r in rows]
