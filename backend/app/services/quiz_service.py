from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.quiz import AttemptAnswer, Question, QuestionOption, QuestionType, Quiz, QuizAttempt
from app.schemas.quiz import AttemptSubmit, QuestionCreate, QuizCreate


def create_quiz(db: Session, creator_id: int, data: QuizCreate) -> Quiz:
    quiz = Quiz(
        course_id=data.course_id,
        title=data.title,
        passing_score=data.passing_score,
        time_limit_minutes=data.time_limit_minutes,
        created_by_id=creator_id,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def add_question(db: Session, quiz_id: int, data: QuestionCreate) -> Question:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if data.type in (QuestionType.MCQ, QuestionType.TRUE_FALSE) and not any(o.is_correct for o in data.options):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one option must be marked correct")
    if data.type == QuestionType.SHORT_ANSWER and not data.correct_text_answer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="correct_text_answer is required for short-answer questions")

    question = Question(
        quiz_id=quiz_id,
        text=data.text,
        type=data.type,
        order=data.order,
        correct_text_answer=data.correct_text_answer,
    )
    db.add(question)
    db.flush()

    for opt in data.options:
        db.add(QuestionOption(question_id=question.id, text=opt.text, is_correct=opt.is_correct))

    db.commit()
    db.refresh(question)
    return question


def get_quiz_for_course(db: Session, course_id: int) -> list[Quiz]:
    return (
        db.query(Quiz)
        .options(selectinload(Quiz.questions).selectinload(Question.options))
        .filter(Quiz.course_id == course_id)
        .all()
    )


def get_quiz_or_404(db: Session, quiz_id: int) -> Quiz:
    quiz = (
        db.query(Quiz)
        .options(selectinload(Quiz.questions).selectinload(Question.options))
        .filter(Quiz.id == quiz_id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


def submit_attempt(db: Session, quiz_id: int, student_id: int, data: AttemptSubmit) -> QuizAttempt:
    quiz = get_quiz_or_404(db, quiz_id)
    questions_by_id = {q.id: q for q in quiz.questions}

    attempt = QuizAttempt(quiz_id=quiz_id, student_id=student_id)
    db.add(attempt)
    db.flush()

    correct_count = 0
    for ans in data.answers:
        question = questions_by_id.get(ans.question_id)
        if not question:
            continue

        is_correct = False
        if question.type in (QuestionType.MCQ, QuestionType.TRUE_FALSE):
            selected = next((o for o in question.options if o.id == ans.selected_option_id), None)
            is_correct = bool(selected and selected.is_correct)
        elif question.type == QuestionType.SHORT_ANSWER:
            given = (ans.text_answer or "").strip().lower()
            expected = (question.correct_text_answer or "").strip().lower()
            is_correct = bool(given) and given == expected

        if is_correct:
            correct_count += 1

        db.add(
            AttemptAnswer(
                attempt_id=attempt.id,
                question_id=ans.question_id,
                selected_option_id=ans.selected_option_id,
                text_answer=ans.text_answer,
                is_correct=is_correct,
            )
        )

    total_questions = len(quiz.questions) or 1
    score_percent = round((correct_count / total_questions) * 100, 1)
    attempt.score_percent = score_percent
    attempt.passed = score_percent >= quiz.passing_score

    db.commit()
    db.refresh(attempt)

    # Transient (non-persisted) fields for a richer result screen on the client.
    attempt.correct_count = correct_count
    attempt.total_questions = len(quiz.questions)
    return attempt


def my_attempts(db: Session, quiz_id: int, student_id: int) -> list[QuizAttempt]:
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz_id, QuizAttempt.student_id == student_id)
        .order_by(QuizAttempt.submitted_at.desc())
        .all()
    )
