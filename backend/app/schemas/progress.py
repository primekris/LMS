from pydantic import BaseModel


class LessonProgressOut(BaseModel):
    lesson_id: int
    completed: bool


class CourseProgressOut(BaseModel):
    course_id: int
    total_lessons: int
    completed_lessons: int
    progress_percent: int
    completed_lesson_ids: list[int] = []
