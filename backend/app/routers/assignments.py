from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentOut, GradeSubmissionRequest, SubmissionOut
from app.services import assignment_service

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

staff_only = require_roles(UserRole.HEAD_ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR)
student_only = require_roles(UserRole.STUDENT)


@router.get("/lesson/{lesson_id}", response_model=list[AssignmentOut])
def list_for_lesson(lesson_id: int, db: Session = Depends(get_db)):
    return assignment_service.list_assignments_for_lesson(db, lesson_id)


@router.post("", response_model=AssignmentOut, status_code=201)
def create_assignment(data: AssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(staff_only)):
    return assignment_service.create_assignment(db, creator_id=current_user.id, data=data)


@router.post("/{assignment_id}/submit", response_model=SubmissionOut, status_code=201)
def submit(
    assignment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only),
):
    return assignment_service.submit_assignment(db, assignment_id, current_user.id, file)


@router.get("/{assignment_id}/submissions", response_model=list[SubmissionOut], dependencies=[Depends(staff_only)])
def list_submissions(assignment_id: int, db: Session = Depends(get_db)):
    return assignment_service.list_submissions(db, assignment_id)


@router.get("/submissions/me", response_model=list[SubmissionOut])
def my_submissions(db: Session = Depends(get_db), current_user: User = Depends(student_only)):
    return assignment_service.my_submissions(db, current_user.id)


@router.patch("/submissions/{submission_id}/grade", response_model=SubmissionOut)
def grade(
    submission_id: int,
    data: GradeSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return assignment_service.grade_submission(db, submission_id, current_user.id, data)
