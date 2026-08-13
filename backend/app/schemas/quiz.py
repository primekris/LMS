from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.quiz import QuestionType


class OptionCreate(BaseModel):
    text: str
    is_correct: bool = False


class QuestionCreate(BaseModel):
    text: str
    type: QuestionType
    order: int = 0
    correct_text_answer: str | None = None  # required for SHORT_ANSWER
    options: list[OptionCreate] = []  # required for MCQ / TRUE_FALSE


class QuizCreate(BaseModel):
    course_id: int
    title: str
    passing_score: int = 70
    time_limit_minutes: int | None = None


# --- Output shapes ---

class OptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    # is_correct intentionally omitted from the student-facing shape;
    # use OptionOutWithAnswer for staff/review views.


class OptionOutWithAnswer(OptionOut):
    is_correct: bool


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    type: QuestionType
    order: int
    options: list[OptionOut] = []


class QuestionOutWithAnswers(QuestionOut):
    options: list[OptionOutWithAnswer] = []
    correct_text_answer: str | None = None


class QuizOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    title: str
    passing_score: int
    time_limit_minutes: int | None = None
    created_at: datetime
    questions: list[QuestionOut] = []


class QuizOutWithAnswers(QuizOut):
    questions: list[QuestionOutWithAnswers] = []


# --- Attempts ---

class AnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: int | None = None
    text_answer: str | None = None


class AttemptSubmit(BaseModel):
    answers: list[AnswerSubmit]


class AttemptResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quiz_id: int
    student_id: int
    score_percent: float
    passed: bool
    submitted_at: datetime
    correct_count: int = 0
    total_questions: int = 0
