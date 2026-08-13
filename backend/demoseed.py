"""
demoseed.py
-----------
Running this script will populate the entire backend data model with demo data:

  - Users        (moderator, instructors, students, donors)
  - Categories
  - Courses -> Modules -> Lessons -> Resources
  - Enrollments + Lesson Progress
  - Quizzes -> Questions -> Options + Quiz Attempts
  - Assignments + Submissions
  - Certificates (for completed courses)
  - Donation Campaigns + Donations

This script uses the project\'s real SQLAlchemy models (app/models/*) and security
helpers (app/core/security.py), so all generated data
will match the data created by the application itself.

Usage (from the backend/ folder):
    python demoseed.py

When run again:
  - Users / Categories / Courses / Campaigns -> skip if they already exist
    (unique key: email / name / slug / title)
  - Enrollments, quiz attempts, submissions, certificates, donations,
    progress -> skip if a record for that combination already exists
  (This makes the script safe to run multiple times.)
"""

from datetime import datetime, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.category import Category
from app.models.certificate import Certificate
from app.models.course import Course, Lesson, Module
from app.models.donation import Donation, DonationCampaign
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.progress import LessonProgress
from app.models.quiz import (
    Question,
    QuestionOption,
    QuestionType,
    Quiz,
    QuizAttempt,
)
from app.models.resource import Resource, ResourceKind, ResourceType
from app.models.user import ModeratorPermission, User, UserRole

DEMO_PASSWORD = "Demo@123"
NOW = lambda: datetime.now(timezone.utc)  # noqa: E731


# ---------------------------------------------------------------------------
# 1) USERS
# ---------------------------------------------------------------------------
DEMO_USERS = [
    {
        "full_name": "Riya Kapoor",
        "email": "riya.moderator@ngolms.com",
        "role": UserRole.MODERATOR,
        "permissions": {
            "can_manage_users": True,
            "can_manage_courses": True,
            "can_manage_resources": False,
            "can_manage_enrollments": True,
            "can_view_reports": True,
        },
    },
    {"full_name": "Arjun Malhotra", "email": "arjun.instructor@ngolms.com", "role": UserRole.INSTRUCTOR},
    {"full_name": "Meera Joshi", "email": "meera.instructor@ngolms.com", "role": UserRole.INSTRUCTOR},
    {"full_name": "Aditya Rao", "email": "aditya.student@ngolms.com", "role": UserRole.STUDENT},
    {"full_name": "Sanya Kapoor", "email": "sanya.student@ngolms.com", "role": UserRole.STUDENT},
    {"full_name": "Kabir Sharma", "email": "kabir.student@ngolms.com", "role": UserRole.STUDENT},
    {"full_name": "Nisha Reddy", "email": "nisha.donor@ngolms.com", "role": UserRole.DONOR},
    {"full_name": "Devansh Bhatt", "email": "devansh.donor@ngolms.com", "role": UserRole.DONOR},
]


def seed_users(db) -> dict:
    users_by_email = {}
    added = 0

    for u in DEMO_USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            users_by_email[u["email"]] = existing
            continue

        user = User(
            full_name=u["full_name"],
            email=u["email"],
            hashed_password=hash_password(DEMO_PASSWORD),
            role=u["role"],
        )
        db.add(user)
        db.flush()

        if u["role"] == UserRole.MODERATOR:
            perms = u.get("permissions", {})
            db.add(ModeratorPermission(user_id=user.id, **perms))

        users_by_email[u["email"]] = user
        added += 1

    db.commit()
    print(f"Users: {added} newly added, {len(DEMO_USERS) - added} already existed.")
    return users_by_email


# ---------------------------------------------------------------------------
# 2) CATEGORIES
# ---------------------------------------------------------------------------
CATEGORY_NAMES = ["Digital Skills", "Health & Wellness", "Community Development"]


def seed_categories(db) -> dict:
    by_name = {}
    added = 0
    for name in CATEGORY_NAMES:
        existing = db.query(Category).filter(Category.name == name).first()
        if existing:
            by_name[name] = existing
            continue
        cat = Category(name=name)
        db.add(cat)
        db.flush()
        by_name[name] = cat
        added += 1
    db.commit()
    print(f"Categories: {added} newly added, {len(CATEGORY_NAMES) - added} already existed.")
    return by_name


# ---------------------------------------------------------------------------
# 3) COURSES -> MODULES -> LESSONS -> RESOURCES
# ---------------------------------------------------------------------------
COURSES_DATA = [
    {
        "title": "Basic Computer & Internet Skills",
        "slug": "basic-computer-internet-skills",
        "description": "Learn how to use computers, the internet, and email as a beginner.",
        "category": "Digital Skills",
        "instructor_email": "arjun.instructor@ngolms.com",
        "is_published": True,
        "modules": [
            {
                "title": "Getting Started",
                "lessons": [
                    {"title": "Introduction to Computers", "content": "Basic computer parts and how to use them."},
                    {"title": "Using the Internet Safely", "content": "Internet browsing and online safety tips."},
                ],
            },
            {
                "title": "Communication Tools",
                "lessons": [
                    {"title": "Creating an Email Account", "content": "How to create and use an email account."},
                    {"title": "Video Calling Basics", "content": "How to connect with others through video calls."},
                ],
            },
        ],
    },
    {
        "title": "Community Health Worker Basics",
        "slug": "community-health-worker-basics",
        "description": "Training to promote basic health awareness in villages and communities.",
        "category": "Health & Wellness",
        "instructor_email": "meera.instructor@ngolms.com",
        "is_published": True,
        "modules": [
            {
                "title": "Foundations of Health",
                "lessons": [
                    {"title": "Hygiene & Sanitation", "content": "Basic hygiene and sanitation principles."},
                    {"title": "Nutrition Basics", "content": "Information about balanced diets and nutrition."},
                ],
            },
            {
                "title": "First Response",
                "lessons": [
                    {"title": "Basic First Aid", "content": "Basic first aid for minor injuries."},
                    {"title": "When to Refer to a Clinic", "content": "When a patient should be referred to a clinic."},
                ],
            },
        ],
    },
    {
        "title": "Leadership for Community Volunteers",
        "slug": "leadership-community-volunteers",
        "description": "Leadership and project management skills for local volunteers.",
        "category": "Community Development",
        "instructor_email": "arjun.instructor@ngolms.com",
        "is_published": True,
        "modules": [
            {
                "title": "Leading Small Teams",
                "lessons": [
                    {"title": "Communication & Listening", "content": "Effective communication with a team."},
                    {"title": "Planning a Community Event", "content": "Basic steps for planning a community event."},
                ],
            }
        ],
    },
]


def seed_courses(db, users_by_email, categories_by_name):
    courses_by_slug = {}
    lessons_by_course_slug = {}
    added = 0

    for c in COURSES_DATA:
        existing = db.query(Course).filter(Course.slug == c["slug"]).first()
        if existing:
            courses_by_slug[c["slug"]] = existing
            lessons_by_course_slug[c["slug"]] = (
                db.query(Lesson).join(Module).filter(Module.course_id == existing.id).all()
            )
            continue

        course = Course(
            title=c["title"],
            slug=c["slug"],
            description=c["description"],
            is_published=c["is_published"],
            category_id=categories_by_name[c["category"]].id,
            instructor_id=users_by_email[c["instructor_email"]].id,
        )
        db.add(course)
        db.flush()

        course_lessons = []
        for m_order, m in enumerate(c["modules"]):
            module = Module(course_id=course.id, title=m["title"], order=m_order)
            db.add(module)
            db.flush()

            for l_order, l in enumerate(m["lessons"]):
                lesson = Lesson(module_id=module.id, title=l["title"], content=l["content"], order=l_order)
                db.add(lesson)
                db.flush()
                course_lessons.append(lesson)

                # Add a real YouTube learning resource to every lesson.
                youtube_links = {
                    "Introduction to Computers": "https://www.youtube.com/watch?v=5pAhHwqBEl0",
                    "Using the Internet Safely": "https://www.youtube.com/watch?v=JgT89_OtgBA",
                    "Creating an Email Account": "https://www.youtube.com/watch?v=v0_UvjmP0Ek",
                    "Video Calling Basics": "https://www.youtube.com/watch?v=OY2XryZGxYE",
                    "Hygiene & Sanitation": "https://www.youtube.com/watch?v=fpXh2XHwMmE",
                    "Nutrition Basics": "https://www.youtube.com/watch?v=2Aa_b-QNIOM",
                    "Basic First Aid": "https://www.youtube.com/watch?v=IENxLXRR9Ss",
                    "When to Refer to a Clinic": "https://www.youtube.com/watch?v=V6ucRwBliqc",
                    "Communication & Listening": "https://www.youtube.com/watch?v=7wUCyjiyXdg",
                    "Planning a Community Event": "https://www.youtube.com/watch?v=t1iVMYmW-Ko",
                }
                db.add(
                    Resource(
                        lesson_id=lesson.id,
                        title=f"{lesson.title} - YouTube Video",
                        resource_type=ResourceType.EXTERNAL_LINK,
                        kind=ResourceKind.LINK,
                        external_url=youtube_links[lesson.title],
                        uploaded_by_id=course.instructor_id,
                    )
                )


        courses_by_slug[c["slug"]] = course
        lessons_by_course_slug[c["slug"]] = course_lessons
        added += 1

    db.commit()
    print(f"Courses: {added} newly added, {len(COURSES_DATA) - added} already existed.")
    return courses_by_slug, lessons_by_course_slug


# ---------------------------------------------------------------------------
# 4) ENROLLMENTS + LESSON PROGRESS
# ---------------------------------------------------------------------------
# (student_email, course_slug, status, progress_percent, completed_lesson_count)
ENROLLMENT_PLAN = [
    ("aditya.student@ngolms.com", "basic-computer-internet-skills", EnrollmentStatus.COMPLETED, 100, "all"),
    ("aditya.student@ngolms.com", "community-health-worker-basics", EnrollmentStatus.ACTIVE, 50, 2),
    ("sanya.student@ngolms.com", "basic-computer-internet-skills", EnrollmentStatus.ACTIVE, 75, 3),
    ("sanya.student@ngolms.com", "leadership-community-volunteers", EnrollmentStatus.COMPLETED, 100, "all"),
    ("kabir.student@ngolms.com", "community-health-worker-basics", EnrollmentStatus.COMPLETED, 100, "all"),
    ("kabir.student@ngolms.com", "leadership-community-volunteers", EnrollmentStatus.ACTIVE, 50, 1),
]


def seed_enrollments_and_progress(db, users_by_email, courses_by_slug, lessons_by_course_slug):
    added_enroll, added_progress = 0, 0

    for student_email, slug, status, percent, completed in ENROLLMENT_PLAN:
        student = users_by_email[student_email]
        course = courses_by_slug[slug]

        enrollment = (
            db.query(Enrollment)
            .filter(Enrollment.student_id == student.id, Enrollment.course_id == course.id)
            .first()
        )
        if not enrollment:
            enrollment = Enrollment(
                student_id=student.id,
                course_id=course.id,
                status=status,
                progress_percent=percent,
            )
            db.add(enrollment)
            db.flush()
            added_enroll += 1

        lessons = lessons_by_course_slug[slug]
        to_complete = lessons if completed == "all" else lessons[:completed]
        for lesson in to_complete:
            exists = (
                db.query(LessonProgress)
                .filter(LessonProgress.student_id == student.id, LessonProgress.lesson_id == lesson.id)
                .first()
            )
            if not exists:
                db.add(LessonProgress(student_id=student.id, lesson_id=lesson.id))
                added_progress += 1

    db.commit()
    print(f"Enrollments: {added_enroll} newly added. Lesson progress entries: {added_progress} newly added.")


# ---------------------------------------------------------------------------
# 5) QUIZZES -> QUESTIONS -> OPTIONS + ATTEMPTS
# ---------------------------------------------------------------------------
def seed_quizzes(db, users_by_email, courses_by_slug):
    added_quiz, added_attempt = 0, 0

    quiz_defs = {
        "basic-computer-internet-skills": {
            "title": "Computer & Internet Basics Quiz",
            "created_by": "arjun.instructor@ngolms.com",
            "questions": [
                {
                    "text": "What do you need to send an email?",
                    "type": QuestionType.MCQ,
                    "options": [("Email address", True), ("Only a phone", False), ("Nothing", False)],
                },
                {
                    "text": "It is safe to share your password on public Wi-Fi.",
                    "type": QuestionType.TRUE_FALSE,
                    "options": [("True", False), ("False", True)],
                },
            ],
        },
        "community-health-worker-basics": {
            "title": "Community Health Basics Quiz",
            "created_by": "meera.instructor@ngolms.com",
            "questions": [
                {
                    "text": "When should you wash your hands?",
                    "type": QuestionType.MCQ,
                    "options": [("Never", False), ("Only after eating", False), ("Regularly, especially before eating", True)],
                },
                {
                    "text": "What does first aid mean?",
                    "type": QuestionType.SHORT_ANSWER,
                    "correct_text_answer": "Initial emergency care",
                },
            ],
        },
    }

    attempts_plan = [
        ("basic-computer-internet-skills", "aditya.student@ngolms.com", 100, True),
        ("basic-computer-internet-skills", "sanya.student@ngolms.com", 80, True),
        ("community-health-worker-basics", "kabir.student@ngolms.com", 90, True),
        ("community-health-worker-basics", "aditya.student@ngolms.com", 60, False),
    ]

    quizzes_by_slug = {}

    for slug, qdef in quiz_defs.items():
        course = courses_by_slug[slug]
        quiz = db.query(Quiz).filter(Quiz.course_id == course.id, Quiz.title == qdef["title"]).first()
        if not quiz:
            quiz = Quiz(
                course_id=course.id,
                title=qdef["title"],
                passing_score=70,
                created_by_id=users_by_email[qdef["created_by"]].id,
            )
            db.add(quiz)
            db.flush()

            for q_order, q in enumerate(qdef["questions"]):
                question = Question(
                    quiz_id=quiz.id,
                    text=q["text"],
                    type=q["type"],
                    correct_text_answer=q.get("correct_text_answer"),
                    order=q_order,
                )
                db.add(question)
                db.flush()

                for opt_text, is_correct in q.get("options", []):
                    db.add(QuestionOption(question_id=question.id, text=opt_text, is_correct=is_correct))

            added_quiz += 1

        quizzes_by_slug[slug] = quiz

    db.commit()

    for slug, student_email, score, passed in attempts_plan:
        quiz = quizzes_by_slug[slug]
        student = users_by_email[student_email]
        exists = (
            db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz.id, QuizAttempt.student_id == student.id).first()
        )
        if exists:
            continue
        db.add(QuizAttempt(quiz_id=quiz.id, student_id=student.id, score_percent=score, passed=passed))
        added_attempt += 1

    db.commit()
    print(f"Quizzes: {added_quiz} newly added. Quiz attempts: {added_attempt} newly added.")
    return quizzes_by_slug


# ---------------------------------------------------------------------------
# 6) ASSIGNMENTS + SUBMISSIONS
# ---------------------------------------------------------------------------
def seed_assignments(db, users_by_email, courses_by_slug, lessons_by_course_slug):
    added_assign, added_sub = 0, 0

    assignment_defs = [
        {
            "course_slug": "basic-computer-internet-skills",
            "title": "Email Account Screenshot Submission",
            "instructions": "Create a new email account and submit a screenshot of it.",
            "created_by": "arjun.instructor@ngolms.com",
            "submissions": [
                ("aditya.student@ngolms.com", 95.0, "Great work!"),
                ("sanya.student@ngolms.com", None, None),
            ],
        },
        {
            "course_slug": "community-health-worker-basics",
            "title": "Household Hygiene Checklist",
            "instructions": "Complete a hygiene checklist for your home and submit it.",
            "created_by": "meera.instructor@ngolms.com",
            "submissions": [
                ("kabir.student@ngolms.com", 88.0, "Well documented."),
            ],
        },
    ]

    for a in assignment_defs:
        lessons = lessons_by_course_slug[a["course_slug"]]
        first_lesson = lessons[0]

        assignment = (
            db.query(Assignment)
            .filter(Assignment.lesson_id == first_lesson.id, Assignment.title == a["title"])
            .first()
        )
        if not assignment:
            assignment = Assignment(
                lesson_id=first_lesson.id,
                title=a["title"],
                instructions=a["instructions"],
                due_date=NOW() + timedelta(days=14),
                created_by_id=users_by_email[a["created_by"]].id,
            )
            db.add(assignment)
            db.flush()
            added_assign += 1

        for student_email, grade, feedback in a["submissions"]:
            student = users_by_email[student_email]
            exists = (
                db.query(AssignmentSubmission)
                .filter(
                    AssignmentSubmission.assignment_id == assignment.id,
                    AssignmentSubmission.student_id == student.id,
                )
                .first()
            )
            if exists:
                continue

            sub = AssignmentSubmission(
                assignment_id=assignment.id,
                student_id=student.id,
                file_path=f"uploads/demo/submission-{assignment.id}-{student.id}.pdf",
            )
            if grade is not None:
                sub.grade = grade
                sub.feedback = feedback
                sub.graded_at = NOW()
                sub.graded_by_id = users_by_email[a["created_by"]].id
            db.add(sub)
            added_sub += 1

    db.commit()
    print(f"Assignments: {added_assign} newly added. Submissions: {added_sub} newly added.")


# ---------------------------------------------------------------------------
# 7) CERTIFICATES (for completed enrollments)
# ---------------------------------------------------------------------------
def seed_certificates(db, users_by_email, courses_by_slug):
    added = 0
    completed = [
        ("aditya.student@ngolms.com", "basic-computer-internet-skills", "arjun.instructor@ngolms.com"),
        ("sanya.student@ngolms.com", "leadership-community-volunteers", "arjun.instructor@ngolms.com"),
        ("kabir.student@ngolms.com", "community-health-worker-basics", "meera.instructor@ngolms.com"),
    ]

    for student_email, slug, issuer_email in completed:
        student = users_by_email[student_email]
        course = courses_by_slug[slug]
        exists = (
            db.query(Certificate)
            .filter(Certificate.student_id == student.id, Certificate.course_id == course.id)
            .first()
        )
        if exists:
            continue
        db.add(
            Certificate(
                student_id=student.id,
                course_id=course.id,
                issued_by_id=users_by_email[issuer_email].id,
            )
        )
        added += 1

    db.commit()
    print(f"Certificates: {added} newly added.")


# ---------------------------------------------------------------------------
# 8) DONATION CAMPAIGNS + DONATIONS
# ---------------------------------------------------------------------------
def seed_donations(db, users_by_email):
    campaign_defs = [
        {
            "title": "Digital Literacy for Villages",
            "description": "Funding to provide computers to schools in villages.",
            "goal_amount": 200000,
            "created_by": "riya.moderator@ngolms.com",
            "donations": [
                ("nisha.donor@ngolms.com", 5000, "Great initiative!"),
                ("devansh.donor@ngolms.com", 10000, "Happy to support."),
            ],
        },
        {
            "title": "Community Health Camps",
            "description": "Funding to organize free health checkup camps.",
            "goal_amount": 150000,
            "created_by": "riya.moderator@ngolms.com",
            "donations": [
                ("nisha.donor@ngolms.com", 3000, None),
            ],
        },
    ]

    added_campaign, added_donation = 0, 0

    for c in campaign_defs:
        campaign = db.query(DonationCampaign).filter(DonationCampaign.title == c["title"]).first()
        if not campaign:
            campaign = DonationCampaign(
                title=c["title"],
                description=c["description"],
                goal_amount=c["goal_amount"],
                created_by_id=users_by_email[c["created_by"]].id,
            )
            db.add(campaign)
            db.flush()
            added_campaign += 1

        for donor_email, amount, message in c["donations"]:
            donor = users_by_email[donor_email]
            exists = (
                db.query(Donation)
                .filter(Donation.campaign_id == campaign.id, Donation.donor_id == donor.id, Donation.amount == amount)
                .first()
            )
            if exists:
                continue
            db.add(Donation(donor_id=donor.id, campaign_id=campaign.id, amount=amount, message=message))
            added_donation += 1

    db.commit()
    print(f"Donation campaigns: {added_campaign} newly added. Donations: {added_donation} newly added.")


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def main():
    Base.metadata.create_all(bind=engine)  # zero-friction: tables ensure they exist
    db = SessionLocal()
    try:
        users_by_email = seed_users(db)
        categories_by_name = seed_categories(db)
        courses_by_slug, lessons_by_course_slug = seed_courses(db, users_by_email, categories_by_name)
        seed_enrollments_and_progress(db, users_by_email, courses_by_slug, lessons_by_course_slug)
        seed_quizzes(db, users_by_email, courses_by_slug)
        seed_assignments(db, users_by_email, courses_by_slug, lessons_by_course_slug)
        seed_certificates(db, users_by_email, courses_by_slug)
        seed_donations(db, users_by_email)
    finally:
        db.close()

    print(f"\nPassword for all demo users: {DEMO_PASSWORD}")
    print("Done! All demo data (users, courses, enrollments, quizzes, assignments, certificates, and donations) has been seeded.")


if __name__ == "__main__":
    main()