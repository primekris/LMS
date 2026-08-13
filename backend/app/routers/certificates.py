from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.certificate import CertificateIssueRequest, CertificateOut, CertificateVerifyOut
from app.services import certificate_service

router = APIRouter(prefix="/api/certificates", tags=["certificates"])

staff_only = require_roles(UserRole.HEAD_ADMIN, UserRole.MODERATOR, UserRole.INSTRUCTOR)
student_only = require_roles(UserRole.STUDENT)


@router.post("", response_model=CertificateOut, status_code=201)
def issue_certificate(
    data: CertificateIssueRequest, db: Session = Depends(get_db), current_user: User = Depends(staff_only)
):
    return certificate_service.issue_certificate(db, current_user.id, data.student_id, data.course_id)


@router.get("/me", response_model=list[CertificateOut])
def my_certificates(db: Session = Depends(get_db), current_user: User = Depends(student_only)):
    return certificate_service.my_certificates(db, current_user.id)


@router.get("/verify/{code}", response_model=CertificateVerifyOut)
def verify(code: str, db: Session = Depends(get_db)):
    """Public endpoint — anyone with the code can verify a certificate's authenticity."""
    return certificate_service.verify_certificate(db, code)
