import secrets
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.core.database import Base


def _gen_code() -> str:
    return secrets.token_hex(6).upper()  # e.g. "A1B2C3D4E5F6"


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, default=_gen_code)
    issued_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    issuer = relationship("User", foreign_keys=[issued_by_id])
    course = relationship("Course")

    # Convenience read-only fields used to render the printable certificate
    # on the frontend without extra round-trips.
    @property
    def student_name(self) -> str | None:
        return self.student.full_name if self.student else None

    @property
    def course_title(self) -> str | None:
        return self.course.title if self.course else None

    @property
    def issuer_name(self) -> str | None:
        return self.issuer.full_name if self.issuer else None

    @property
    def org_name(self) -> str:
        return settings.APP_NAME
