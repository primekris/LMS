from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.donation import Donation, DonationCampaign
from app.models.enrollment import Enrollment
from app.models.user import User, UserRole
from app.schemas.course import CourseSummaryOut
from app.schemas.donation import CampaignOut
from app.services import donation_service

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/stats")
def public_stats(db: Session = Depends(get_db)):
    return {
        "total_students": db.query(func.count(User.id)).filter(User.role == UserRole.STUDENT).scalar(),
        "total_instructors": db.query(func.count(User.id)).filter(User.role == UserRole.INSTRUCTOR).scalar(),
        "total_courses": db.query(func.count(Course.id)).filter(Course.is_published.is_(True)).scalar(),
        "total_enrollments": db.query(func.count(Enrollment.id)).scalar(),
        "total_certificates": db.query(func.count(Certificate.id)).scalar(),
        "total_donations_raised": float(db.query(func.coalesce(func.sum(Donation.amount), 0)).scalar()),
    }


@router.get("/featured-courses", response_model=list[CourseSummaryOut])
def featured_courses(db: Session = Depends(get_db)):
    return (
        db.query(Course)
        .filter(Course.is_published.is_(True))
        .order_by(Course.created_at.desc())
        .limit(6)
        .all()
    )


@router.get("/featured-campaigns", response_model=list[CampaignOut])
def featured_campaigns(db: Session = Depends(get_db)):
    campaigns = (
        db.query(DonationCampaign)
        .filter(DonationCampaign.is_active.is_(True))
        .order_by(DonationCampaign.created_at.desc())
        .limit(4)
        .all()
    )
    return [donation_service._with_totals(db, c) for c in campaigns]
