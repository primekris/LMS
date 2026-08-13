from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.course import Lesson, Module
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.progress import LessonProgress


def _course_id_for_lesson(db: Session, lesson_id: int) -> int:
    row = (
        db.query(Module.course_id)
        .join(Lesson, Lesson.module_id == Module.id)
        .filter(Lesson.id == lesson_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return row[0]


def _recompute_enrollment_progress(db: Session, student_id: int, course_id: int) -> int:
    total_lessons = (
        db.query(Lesson)
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id)
        .count()
    )
    completed_lessons = (
        db.query(LessonProgress)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id, LessonProgress.student_id == student_id)
        .count()
    )
    percent = round((completed_lessons / total_lessons) * 100) if total_lessons else 0

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id, Enrollment.course_id == course_id)
        .first()
    )
    if enrollment:
        enrollment.progress_percent = percent
        if percent >= 100:
            enrollment.status = EnrollmentStatus.COMPLETED
        db.commit()

    return percent


def mark_lesson_complete(db: Session, student_id: int, lesson_id: int) -> int:
    course_id = _course_id_for_lesson(db, lesson_id)

    existing = (
        db.query(LessonProgress)
        .filter(LessonProgress.student_id == student_id, LessonProgress.lesson_id == lesson_id)
        .first()
    )
    if not existing:
        db.add(LessonProgress(student_id=student_id, lesson_id=lesson_id))
        db.commit()

    return _recompute_enrollment_progress(db, student_id, course_id)


def get_course_progress(db: Session, student_id: int, course_id: int) -> dict:
    total_lessons = (
        db.query(Lesson)
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id)
        .count()
    )
    completed_rows = (
        db.query(LessonProgress.lesson_id)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id, LessonProgress.student_id == student_id)
        .all()
    )
    completed_ids = [r[0] for r in completed_rows]
    percent = round((len(completed_ids) / total_lessons) * 100) if total_lessons else 0

    return {
        "course_id": course_id,
        "total_lessons": total_lessons,
        "completed_lessons": len(completed_ids),
        "progress_percent": percent,
        "completed_lesson_ids": completed_ids,
    }
