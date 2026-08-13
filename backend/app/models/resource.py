import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResourceType(str, enum.Enum):
    FILE = "file"          # stored via the storage abstraction (local/S3/Cloudinary)
    EXTERNAL_LINK = "external_link"  # YouTube, Drive, Dropbox, OneDrive, Vimeo, other


class ResourceKind(str, enum.Enum):
    VIDEO = "video"
    IMAGE = "image"
    PDF = "pdf"
    DOCX = "docx"
    PPT = "ppt"
    ZIP = "zip"
    LINK = "link"


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    resource_type: Mapped[ResourceType] = mapped_column(Enum(ResourceType), nullable=False)
    kind: Mapped[ResourceKind] = mapped_column(Enum(ResourceKind), nullable=False)

    # For FILE resources: the storage-backend-relative path/key.
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # For EXTERNAL_LINK resources: the raw pasted URL.
    external_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    lesson = relationship("Lesson", back_populates="resources")
