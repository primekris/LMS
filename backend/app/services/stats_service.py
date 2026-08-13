from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.course import Course, Lesson, Module
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.resource import Resource
from app.models.user import User, UserRole


def user_stats(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    by_role = dict(db.query(User.role, func.count(User.id)).group_by(User.role).all())
    total_users = sum(by_role.values())
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar()
    inactive_users = total_users - active_users

    new_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar()
    new_this_month = db.query(func.count(User.id)).filter(User.created_at >= month_start).scalar()

    # Registration trend: last 14 days, count per day
    trend_start = today_start - timedelta(days=13)
    rows = (
        db.query(func.date(User.created_at), func.count(User.id))
        .filter(User.created_at >= trend_start)
        .group_by(func.date(User.created_at))
        .all()
    )
    counts_by_day = {str(day): count for day, count in rows}
    trend = []
    for i in range(14):
        day = (trend_start + timedelta(days=i)).date()
        trend.append({"date": str(day), "count": counts_by_day.get(str(day), 0)})

    return {
        "total_users": total_users,
        "by_role": {role.value if hasattr(role, "value") else role: count for role, count in by_role.items()},
        "active_users": active_users,
        "inactive_users": inactive_users,
        "new_today": new_today,
        "new_this_month": new_this_month,
        "registration_trend": trend,
    }


def course_stats(db: Session) -> dict:
    total_courses = db.query(func.count(Course.id)).scalar()
    published = db.query(func.count(Course.id)).filter(Course.is_published.is_(True)).scalar()
    draft = total_courses - published
    total_modules = db.query(func.count(Module.id)).scalar()
    total_lessons = db.query(func.count(Lesson.id)).scalar()
    total_resources = db.query(func.count(Resource.id)).scalar()
    total_enrollments = db.query(func.count(Enrollment.id)).scalar()
    completed = db.query(func.count(Enrollment.id)).filter(Enrollment.status == EnrollmentStatus.COMPLETED).scalar()
    completion_rate = round((completed / total_enrollments) * 100, 1) if total_enrollments else 0

    return {
        "total_courses": total_courses,
        "published_courses": published,
        "draft_courses": draft,
        "total_modules": total_modules,
        "total_lessons": total_lessons,
        "total_resources": total_resources,
        "total_enrollments": total_enrollments,
        "completion_rate": completion_rate,
    }
