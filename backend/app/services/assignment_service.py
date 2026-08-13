from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.assignment import Assignment, AssignmentSubmission
from app.schemas.assignment import AssignmentCreate, GradeSubmissionRequest
from app.services.storage_service import get_storage


def create_assignment(db: Session, creator_id: int, data: AssignmentCreate) -> Assignment:
    assignment = Assignment(
        lesson_id=data.lesson_id,
        title=data.title,
        instructions=data.instructions,
        due_date=data.due_date,
        created_by_id=creator_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def list_assignments_for_lesson(db: Session, lesson_id: int) -> list[Assignment]:
    return db.query(Assignment).filter(Assignment.lesson_id == lesson_id).all()


def submit_assignment(db: Session, assignment_id: int, student_id: int, file: UploadFile) -> AssignmentSubmission:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    existing = (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.assignment_id == assignment_id, AssignmentSubmission.student_id == student_id)
        .first()
    )
    storage = get_storage()
    key = storage.save(file, subfolder="submissions")

    if existing:
        existing.file_path = key
        existing.submitted_at = datetime.now(timezone.utc)
        existing.grade = None
        existing.feedback = None
        existing.graded_at = None
        db.commit()
        db.refresh(existing)
        return existing

    submission = AssignmentSubmission(assignment_id=assignment_id, student_id=student_id, file_path=key)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def list_submissions(db: Session, assignment_id: int) -> list[AssignmentSubmission]:
    return db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id).all()


def my_submissions(db: Session, student_id: int) -> list[AssignmentSubmission]:
    return db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student_id).all()


def grade_submission(db: Session, submission_id: int, grader_id: int, data: GradeSubmissionRequest) -> AssignmentSubmission:
    submission = db.get(AssignmentSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    submission.grade = data.grade
    submission.feedback = data.feedback
    submission.graded_at = datetime.now(timezone.utc)
    submission.graded_by_id = grader_id

    db.commit()
    db.refresh(submission)
    return submission
