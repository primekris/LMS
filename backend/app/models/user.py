import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    HEAD_ADMIN = "head_admin"
    MODERATOR = "moderator"
    INSTRUCTOR = "instructor"
    STUDENT = "student"
    DONOR = "donor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    permissions: Mapped["ModeratorPermission"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    courses_taught = relationship("Course", back_populates="instructor")


# Individual permission flags a Head Admin can grant a Moderator.
class ModeratorPermission(Base):
    __tablename__ = "moderator_permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    can_manage_users: Mapped[bool] = mapped_column(Boolean, default=False)
    can_manage_courses: Mapped[bool] = mapped_column(Boolean, default=False)
    can_manage_resources: Mapped[bool] = mapped_column(Boolean, default=False)
    can_manage_enrollments: Mapped[bool] = mapped_column(Boolean, default=False)
    can_view_reports: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="permissions")
