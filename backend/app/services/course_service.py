import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course, Lesson, Module
from app.models.category import Category
from app.schemas.course import CourseCreate, LessonCreate, ModuleCreate


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "course"


def create_course(db: Session, instructor_id: int, data: CourseCreate) -> Course:
    base_slug = slugify(data.title)
    slug = base_slug
    counter = 1
    while db.query(Course).filter(Course.slug == slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"

    course = Course(
        title=data.title,
        slug=slug,
        description=data.description,
        cover_image_url=data.cover_image_url,
        category_id=data.category_id,
        instructor_id=instructor_id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def get_course_or_404(db: Session, course_id: int) -> Course:
    course = (
        db.query(Course)
        .options(
            selectinload(Course.modules)
            .selectinload(Module.lessons)
            .selectinload(Lesson.resources)
        )
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def list_courses(db: Session, published_only: bool = False, category_id: int | None = None) -> list[Course]:
    query = db.query(Course)
    if published_only:
        query = query.filter(Course.is_published.is_(True))
    if category_id:
        query = query.filter(Course.category_id == category_id)
    return query.order_by(Course.created_at.desc()).all()


def list_categories(db: Session) -> list[Category]:
    return db.query(Category).order_by(Category.name).all()


def create_category(db: Session, name: str) -> Category:
    existing = db.query(Category).filter(Category.name == name).first()
    if existing:
        return existing
    category = Category(name=name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def add_module(db: Session, course_id: int, data: ModuleCreate) -> Module:
    get_course_or_404(db, course_id)
    module = Module(course_id=course_id, title=data.title, order=data.order)
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


def add_lesson(db: Session, module_id: int, data: LessonCreate) -> Lesson:
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    lesson = Lesson(module_id=module_id, title=data.title, content=data.content, order=data.order)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def set_published(db: Session, course_id: int, published: bool) -> Course:
    course = get_course_or_404(db, course_id)
    course.is_published = published
    db.commit()
    db.refresh(course)
    return course
