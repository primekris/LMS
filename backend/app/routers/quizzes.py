from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.quiz import (
    AttemptResultOut,
    AttemptSubmit,
    QuestionCreate,
    QuestionOut,
    QuestionOutWithAnswers,
    QuizCreate,
    QuizOut,
    QuizOutWithAnswers,
)
from app.services import quiz_service

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

staff_only = require_roles(UserRole.HEAD_ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR)
student_only = require_roles(UserRole.STUDENT)


@router.get("/course/{course_id}", response_model=list[QuizOut])
def list_quizzes_for_course(course_id: int, db: Session = Depends(get_db)):
    """Student-facing: quizzes without answer keys."""
    return quiz_service.get_quiz_for_course(db, course_id)


@router.get("/{quiz_id}", response_model=QuizOutWithAnswers, dependencies=[Depends(staff_only)])
def get_quiz_with_answers(quiz_id: int, db: Session = Depends(get_db)):
    """Staff-facing: includes correct answers for review/editing."""
    return quiz_service.get_quiz_or_404(db, quiz_id)


@router.post("", response_model=QuizOut, status_code=201)
def create_quiz(data: QuizCreate, db: Session = Depends(get_db), current_user: User = Depends(staff_only)):
    return quiz_service.create_quiz(db, creator_id=current_user.id, data=data)


@router.post("/{quiz_id}/questions", response_model=QuestionOutWithAnswers, status_code=201)
def add_question(quiz_id: int, data: QuestionCreate, db: Session = Depends(get_db), _: User = Depends(staff_only)):
    return quiz_service.add_question(db, quiz_id, data)


@router.post("/{quiz_id}/attempts", response_model=AttemptResultOut, status_code=201)
def submit_attempt(
    quiz_id: int,
    data: AttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only),
):
    return quiz_service.submit_attempt(db, quiz_id, current_user.id, data)


@router.get("/{quiz_id}/my-attempts", response_model=list[AttemptResultOut])
def my_attempts(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return quiz_service.my_attempts(db, quiz_id, current_user.id)
