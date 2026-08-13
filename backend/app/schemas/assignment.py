from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssignmentCreate(BaseModel):
    lesson_id: int
    title: str
    instructions: str = ""
    due_date: datetime | None = None


class AssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lesson_id: int
    title: str
    instructions: str
    due_date: datetime | None
    created_at: datetime


class SubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assignment_id: int
    student_id: int
    file_path: str
    submitted_at: datetime
    grade: float | None
    feedback: str | None
    graded_at: datetime | None


class GradeSubmissionRequest(BaseModel):
    grade: float
    feedback: str | None = None
