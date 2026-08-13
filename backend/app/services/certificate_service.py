from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.course import Course
from app.models.user import User


def issue_certificate(db: Session, issuer_id: int, student_id: int, course_id: int) -> Certificate:
    existing = (
        db.query(Certificate)
        .filter(Certificate.student_id == student_id, Certificate.course_id == course_id)
        .first()
    )
    if existing:
        return existing

    cert = Certificate(student_id=student_id, course_id=course_id, issued_by_id=issuer_id)
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


def my_certificates(db: Session, student_id: int) -> list[Certificate]:
    return db.query(Certificate).filter(Certificate.student_id == student_id).all()


def verify_certificate(db: Session, code: str) -> dict:
    cert = db.query(Certificate).filter(Certificate.code == code).first()
    if not cert:
        return {"valid": False}

    student = db.get(User, cert.student_id)
    course = db.get(Course, cert.course_id)
    return {
        "valid": True,
        "student_name": student.full_name if student else None,
        "course_title": course.title if course else None,
        "issued_at": cert.issued_at,
    }
