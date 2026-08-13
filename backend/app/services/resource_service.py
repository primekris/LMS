import re

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.resource import Resource, ResourceKind, ResourceType
from app.schemas.resource import ExternalLinkCreate
from app.services.storage_service import get_storage

EXT_TO_KIND = {
    ".mp4": ResourceKind.VIDEO, ".mov": ResourceKind.VIDEO, ".webm": ResourceKind.VIDEO,
    ".png": ResourceKind.IMAGE, ".jpg": ResourceKind.IMAGE, ".jpeg": ResourceKind.IMAGE, ".gif": ResourceKind.IMAGE,
    ".pdf": ResourceKind.PDF,
    ".doc": ResourceKind.DOCX, ".docx": ResourceKind.DOCX,
    ".ppt": ResourceKind.PPT, ".pptx": ResourceKind.PPT,
    ".zip": ResourceKind.ZIP,
}

LINK_PATTERNS = {
    "youtube.com": ResourceKind.VIDEO,
    "youtu.be": ResourceKind.VIDEO,
    "vimeo.com": ResourceKind.VIDEO,
    "drive.google.com": ResourceKind.LINK,
    "dropbox.com": ResourceKind.LINK,
    "onedrive.live.com": ResourceKind.LINK,
    "1drv.ms": ResourceKind.LINK,
}


def detect_link_kind(url: str) -> ResourceKind:
    for domain, kind in LINK_PATTERNS.items():
        if domain in url:
            return kind
    return ResourceKind.LINK


def upload_file_resource(db: Session, lesson_id: int, title: str, upload: UploadFile, uploader_id: int) -> Resource:
    import os

    ext = os.path.splitext(upload.filename or "")[1].lower()
    kind = EXT_TO_KIND.get(ext)
    if kind is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: video, image, pdf, docx, ppt, zip.",
        )

    storage = get_storage()
    key = storage.save(upload, subfolder="resources")

    resource = Resource(
        lesson_id=lesson_id,
        title=title,
        resource_type=ResourceType.FILE,
        kind=kind,
        file_path=key,
        uploaded_by_id=uploader_id,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def add_external_link_resource(db: Session, data: ExternalLinkCreate, uploader_id: int) -> Resource:
    if not re.match(r"^https?://", data.external_url):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="external_url must be a valid http(s) URL")

    kind = detect_link_kind(data.external_url)
    resource = Resource(
        lesson_id=data.lesson_id,
        title=data.title,
        resource_type=ResourceType.EXTERNAL_LINK,
        kind=kind,
        external_url=data.external_url,
        uploaded_by_id=uploader_id,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource
