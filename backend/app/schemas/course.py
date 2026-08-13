from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.resource import ResourceOut


class LessonCreate(BaseModel):
    title: str
    content: str = ""
    order: int = 0


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    content: str
    order: int
    resources: list[ResourceOut] = []


class ModuleCreate(BaseModel):
    title: str
    order: int = 0


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    order: int
    lessons: list[LessonOut] = []


class CourseCreate(BaseModel):
    title: str
    description: str = ""
    cover_image_url: str | None = None
    category_id: int | None = None


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    description: str
    cover_image_url: str | None
    is_published: bool
    category_id: int | None
    instructor_id: int
    created_at: datetime
    modules: list[ModuleOut] = []


class CourseSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    cover_image_url: str | None
    is_published: bool
    category_id: int | None


class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
