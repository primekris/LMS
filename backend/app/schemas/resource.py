from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.resource import ResourceKind, ResourceType


class ExternalLinkCreate(BaseModel):
    lesson_id: int
    title: str
    external_url: str
    kind: ResourceKind = ResourceKind.LINK


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lesson_id: int
    title: str
    resource_type: ResourceType
    kind: ResourceKind
    file_path: str | None
    external_url: str | None
    uploaded_by_id: int
    created_at: datetime
