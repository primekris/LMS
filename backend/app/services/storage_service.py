"""
Storage abstraction.

Today only "local" (disk) storage is implemented. To add S3 or Cloudinary
later: implement a class with the same three methods (save, delete, url)
and switch it in `get_storage()` based on settings.STORAGE_DRIVER — no
other file in the app needs to change.
"""
import os
import uuid
from abc import ABC, abstractmethod

from fastapi import UploadFile

from app.core.config import settings


class StorageBackend(ABC):
    @abstractmethod
    def save(self, upload: UploadFile, subfolder: str = "") -> str:
        """Persist the file and return a storage-relative key/path."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Remove a previously stored file."""

    @abstractmethod
    def url(self, key: str) -> str:
        """Return a URL/path the frontend can use to fetch the file."""


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: str = settings.UPLOAD_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save(self, upload: UploadFile, subfolder: str = "") -> str:
        folder = os.path.join(self.base_dir, subfolder)
        os.makedirs(folder, exist_ok=True)

        ext = os.path.splitext(upload.filename or "")[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        full_path = os.path.join(folder, filename)

        with open(full_path, "wb") as out_file:
            while chunk := upload.file.read(1024 * 1024):
                out_file.write(chunk)

        # Return a key relative to the upload dir, e.g. "resources/abc123.pdf"
        return os.path.join(subfolder, filename).replace("\\", "/")

    def delete(self, key: str) -> None:
        full_path = os.path.join(self.base_dir, key)
        if os.path.exists(full_path):
            os.remove(full_path)

    def url(self, key: str) -> str:
        # Served by FastAPI's static file mount at /uploads
        return f"/uploads/{key}"


def get_storage() -> StorageBackend:
    if settings.STORAGE_DRIVER == "local":
        return LocalStorageBackend()
    # Placeholder for future drivers:
    # if settings.STORAGE_DRIVER == "s3": return S3StorageBackend()
    # if settings.STORAGE_DRIVER == "cloudinary": return CloudinaryStorageBackend()
    raise NotImplementedError(f"Unknown STORAGE_DRIVER: {settings.STORAGE_DRIVER}")
