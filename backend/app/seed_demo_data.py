import random
from datetime import date, datetime, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.blog import Blog, BlogComment, BlogLike, BlogStatus
from app.models.category import Category
from app.models.certificate import Certificate
from app.models.course import Course, Lesson, Module
from app.models.donation import Donation, DonationCampaign, DonationStatus
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.forum import ForumCategory, ForumPost, ForumPostLike, ForumReply
from app.models.progress import LessonProgress
from app.models.quiz import AttemptAnswer, Question, QuestionOption, QuestionType, Quiz, QuizAttempt
from app.models.resource import Resource, ResourceKind, ResourceType
from app.models.user import ModeratorPermission, User, UserRole, generate_member_id

DEMO_PASSWORD = "Demo@123"
MARKER_EMAIL = "priya.sharma@demo.ngo"


def now():
    return datetime.now(timezone.utc)


def make_user(db, full_name, email, role, permissions=None):
    user = User(full_name=full_name, email=email, hashed_password=hash_password(DEMO_PASSWORD), role=role)
    db.add(user)
    db.flush()
    user.member_id = generate_member_id(role, user.id)
    if permissions:
        db.add(ModeratorPermission(user_id=user.id, **permissions))
    return user


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).filter(User.email == MARKER_EMAIL).first():
            print("[seed_demo_data] Demo data already present - skipping.")
            return

        print("[seed_demo_data] Seeding demo data, this takes a few seconds...")

        # ---------------------------------------------------------------
        # Users
        # ---------------------------------------------------------------
        head_admin = db.query(User).filter(User.role == UserRole.HEAD_ADMIN).first()
        if not head_admin:
            head_admin = make_user(db, "Ananya Verma", "admin@ngo-lms.test", UserRole.HEAD_ADMIN)

        mod1 = make_user(
            db, "Rohit Malhotra", "rohit.mod@demo.ngo", UserRole.MODERATOR,
            {"can_manage_users": True, "can_manage_courses": True, "can_manage_resources": True,
             "can_manage_enrollments": True, "can_view_reports": True},
        )
        mod2 = make_user(
            db, "Sneha Kapoor", "sneha.mod@demo.ngo", UserRole.MODERATOR,
            {"can_manage_courses": True, "can_manage_resources": True, "can_view_reports": True},
        )

        inst1 = make_user(db, "Dr. Arjun Mehta", "arjun.inst@demo.ngo", UserRole.INSTRUCTOR)
        inst2 = make_user(db, "Kavita Rao", "kavita.inst@demo.ngo", UserRole.INSTRUCTOR)
        inst3 = make_user(db, "Sameer Khan", "sameer.inst@demo.ngo", UserRole.INSTRUCTOR)

        student_names = [
            "Priya Sharma", "Aditya Singh", "Meera Nair", "Rahul Gupta", "Ishita Joshi",
            "Vikram Patel", "Ananya Iyer", "Karan Chawla", "Divya Reddy", "Aman Tiwari",
        ]
        students = []
        for i, name in enumerate(student_names):
            email = MARKER_EMAIL if i == 0 else f"{name.split()[0].lower()}.student{i}@demo.ngo"
            students.append(make_user(db, name, email, UserRole.STUDENT))

        donor_names = ["Rakesh Agarwal", "Sunita Bhatia", "Global Hope Foundation", "Vivek Oberoi Trust"]
        donors = [make_user(db, n, f"donor{i}@demo.ngo", UserRole.DONOR) for i, n in enumerate(donor_names)]

        db.commit()

        # ---------------------------------------------------------------
        # Course categories + courses
        # ---------------------------------------------------------------
        cat_names = ["Web Development", "Data Skills", "Health & Wellness", "Community Leadership", "Financial Literacy"]
        categories = {}
        for name in cat_names:
            existing = db.query(Category).filter(Category.name == name).first()
            if existing:
                categories[name] = existing
                continue
            c = Category(name=name)
            db.add(c)
            db.flush()
            categories[name] = c
        db.commit()

        courses_spec = [
            {
                "title": "Foundations of Web Development",
                "description": "A hands-on introduction to HTML, CSS and JavaScript for absolute beginners, built for learners who want to start freelancing or find entry-level tech work.",
                "category": "Web Development",
                "instructor": inst1,
                "published": True,
                "modules": [
                    {"title": "Getting Started with HTML", "lessons": [
                        {"title": "What is HTML?", "content": "An overview of how the web works and the role HTML plays in every page you visit."},
                        {"title": "Building your first page", "content": "Hands-on: headings, paragraphs, links, and images."},
                    ]},
                    {"title": "Styling with CSS", "lessons": [
                        {"title": "CSS selectors and the box model", "content": "How browsers apply styles, and how spacing really works."},
                        {"title": "Responsive layouts with Flexbox", "content": "Building layouts that work on both mobile and desktop."},
                    ]},
                ],
                "quiz": {
                    "title": "HTML & CSS Basics Quiz", "passing_score": 70, "time_limit_minutes": 10,
                    "questions": [
                        {"text": "Which tag is used to create a hyperlink?", "type": "mcq",
                         "options": [("<link>", False), ("<a>", True), ("<href>", False), ("<nav>", False)]},
                        {"text": "CSS stands for Cascading Style Sheets.", "type": "true_false", "options": [("True", True), ("False", False)]},
                        {"text": "Which property controls text size in CSS?", "type": "mcq",
                         "options": [("font-size", True), ("text-style", False), ("size", False), ("font-weight", False)]},
                    ],
                },
            },
            {
                "title": "Data Skills for Everyday Decisions",
                "description": "Learn to read, clean and visualize data using free tools - designed for NGO staff and volunteers who work with program data.",
                "category": "Data Skills",
                "instructor": inst2,
                "published": True,
                "modules": [
                    {"title": "Thinking with Data", "lessons": [
                        {"title": "Why data matters for NGOs", "content": "Using data to tell your organisation's impact story."},
                        {"title": "Spreadsheets 101", "content": "Rows, columns, and simple formulas you'll use every day."},
                    ]},
                    {"title": "Visualizing Data", "lessons": [
                        {"title": "Choosing the right chart", "content": "Bar vs line vs pie - when to use each."},
                    ]},
                ],
                "quiz": {
                    "title": "Data Basics Check", "passing_score": 60, "time_limit_minutes": None,
                    "questions": [
                        {"text": "A pie chart is best for showing change over time.", "type": "true_false", "options": [("True", False), ("False", True)]},
                        {"text": "Which of these is a spreadsheet formula?", "type": "mcq",
                         "options": [("=SUM(A1:A10)", True), ("<SUM>A1:A10</SUM>", False), ("SUM[A1-A10]", False), ("sum(A1,A10)!", False)]},
                    ],
                },
            },
            {
                "title": "Community Health Worker Essentials",
                "description": "Core knowledge for volunteer health workers: hygiene, first aid basics, and communicating health information clearly.",
                "category": "Health & Wellness",
                "instructor": inst1,
                "published": True,
                "modules": [
                    {"title": "Hygiene & Prevention", "lessons": [
                        {"title": "Handwashing and sanitation", "content": "The single most effective disease-prevention habit, and how to teach it."},
                    ]},
                    {"title": "First Response", "lessons": [
                        {"title": "Basic first aid", "content": "What to do - and what not to do - in the first five minutes."},
                    ]},
                ],
                "quiz": None,
            },
            {
                "title": "Leading Community Projects",
                "description": "Practical leadership skills for volunteers stepping into project coordination roles - planning, delegation and conflict resolution.",
                "category": "Community Leadership",
                "instructor": inst3,
                "published": True,
                "modules": [
                    {"title": "Planning a Project", "lessons": [
                        {"title": "Setting clear goals", "content": "Turning a good intention into a plan with milestones."},
                    ]},
                ],
                "quiz": None,
            },
            {
                "title": "Personal Finance for New Earners",
                "description": "A practical course for young people starting their first job: budgeting, saving, and avoiding common debt traps.",
                "category": "Financial Literacy",
                "instructor": inst2,
                "published": False,
                "modules": [
                    {"title": "Budgeting Basics", "lessons": [
                        {"title": "The 50/30/20 rule", "content": "A simple starting framework for splitting your income."},
                    ]},
                ],
                "quiz": None,
            },
        ]

        DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        created_courses = []

        for spec in courses_spec:
            slug_base = spec["title"].lower().replace(" ", "-").replace("&", "and")
            course = Course(
                title=spec["title"],
                slug=f"{slug_base}-{random.randint(1000, 9999)}",
                description=spec["description"],
                category_id=categories[spec["category"]].id,
                instructor_id=spec["instructor"].id,
                is_published=spec["published"],
            )
            db.add(course)
            db.flush()

            all_lessons = []
            for m_order, m_spec in enumerate(spec["modules"]):
                module = Module(course_id=course.id, title=m_spec["title"], order=m_order)
                db.add(module)
                db.flush()
                for l_order, l_spec in enumerate(m_spec["lessons"]):
                    lesson = Lesson(module_id=module.id, title=l_spec["title"], content=l_spec["content"], order=l_order)
                    db.add(lesson)
                    db.flush()
                    db.add(Resource(
                        lesson_id=lesson.id, title=f"{l_spec['title']} - video",
                        resource_type=ResourceType.EXTERNAL_LINK, kind=ResourceKind.VIDEO,
                        external_url=DEMO_VIDEO_URL, uploaded_by_id=spec["instructor"].id,
                    ))
                    all_lessons.append(lesson)

            quiz = None
            if spec["quiz"]:
                q_spec = spec["quiz"]
                quiz = Quiz(
                    course_id=course.id, title=q_spec["title"], passing_score=q_spec["passing_score"],
                    time_limit_minutes=q_spec["time_limit_minutes"], created_by_id=spec["instructor"].id,
                )
                db.add(quiz)
                db.flush()
                for q_order, question_spec in enumerate(q_spec["questions"]):
                    question = Question(
                        quiz_id=quiz.id, text=question_spec["text"],
                        type=QuestionType.MCQ if question_spec["type"] == "mcq" else QuestionType.TRUE_FALSE,
                        order=q_order,
                    )
                    db.add(question)
                    db.flush()
                    for opt_text, is_correct in question_spec["options"]:
                        db.add(QuestionOption(question_id=question.id, text=opt_text, is_correct=is_correct))

            db.commit()
            created_courses.append({"course": course, "lessons": all_lessons, "quiz": quiz, "instructor": spec["instructor"]})

        # ---------------------------------------------------------------
        # Enrollments, progress, quiz attempts, certificates
        # ---------------------------------------------------------------
        published_courses = [c for c in created_courses if c["course"].is_published]

        for i, student in enumerate(students):
            enrolled_in = random.sample(published_courses, k=min(3, len(published_courses)))
            for j, cdata in enumerate(enrolled_in):
                course = cdata["course"]
                enrollment = Enrollment(student_id=student.id, course_id=course.id, status=EnrollmentStatus.ACTIVE, progress_percent=0)
                db.add(enrollment)
                db.flush()

                completion_level = (i + j) % 3  # 0 = just started, 1 = halfway, 2 = fully done
                lessons = cdata["lessons"]
                if completion_level == 0:
                    lessons_to_complete = lessons[: max(1, len(lessons) // 3)]
                elif completion_level == 1:
                    lessons_to_complete = lessons[: max(1, len(lessons) // 2)]
                else:
                    lessons_to_complete = lessons

                for lesson in lessons_to_complete:
                    db.add(LessonProgress(student_id=student.id, lesson_id=lesson.id))

                quiz_passed = False
                if cdata["quiz"]:
                    if completion_level == 2 or (completion_level == 1 and random.random() < 0.5):
                        quiz = cdata["quiz"]
                        attempt = QuizAttempt(quiz_id=quiz.id, student_id=student.id, score_percent=0, passed=False)
                        db.add(attempt)
                        db.flush()
                        for question in quiz.questions:
                            correct_option = next((o for o in question.options if o.is_correct), None)
                            db.add(AttemptAnswer(
                                attempt_id=attempt.id, question_id=question.id,
                                selected_option_id=correct_option.id if correct_option else None,
                                is_correct=True,
                            ))
                        attempt.score_percent = 100.0
                        attempt.passed = True
                        quiz_passed = True

                total_lessons = len(lessons)
                completed_lessons = len(lessons_to_complete)
                total_quizzes = 1 if cdata["quiz"] else 0
                passed_quizzes = 1 if quiz_passed else 0
                total_items = total_lessons + total_quizzes
                completed_items = completed_lessons + passed_quizzes
                percent = round((completed_items / total_items) * 100) if total_items else 0
                fully_complete = completed_lessons >= total_lessons and passed_quizzes >= total_quizzes

                enrollment.progress_percent = percent
                if fully_complete:
                    enrollment.status = EnrollmentStatus.COMPLETED
                    db.add(Certificate(student_id=student.id, course_id=course.id, issued_by_id=cdata["instructor"].id))

        db.commit()

        # ---------------------------------------------------------------
        # Donation campaigns + donations
        # ---------------------------------------------------------------
        campaigns_spec = [
            {
                "title": "Clean Water for Rampur Village",
                "description": "Funding a borewell and water filtration unit for 400 families in Rampur who currently walk 3km for safe drinking water.",
                "category": "Water & Sanitation",
                "beneficiary": "400 families across 6 hamlets in Rampur village, Uttar Pradesh.",
                "goal_amount": 500000,
                "end_date": date.today() + timedelta(days=45),
            },
            {
                "title": "School Supplies for 200 Children",
                "description": "Notebooks, uniforms, and basic stationery for children starting the new academic year in our partner government schools.",
                "category": "Education",
                "beneficiary": "200 children (ages 6-14) across 3 government schools.",
                "goal_amount": 150000,
                "end_date": date.today() + timedelta(days=20),
            },
            {
                "title": "Emergency Medical Fund",
                "description": "A standing fund to cover urgent medical costs for families who can't afford emergency treatment.",
                "category": "Health",
                "beneficiary": "Low-income families referred by our community health workers.",
                "goal_amount": 300000,
                "end_date": None,
            },
            {
                "title": "Winter Blanket Drive",
                "description": "Warm blankets and clothing for elderly residents and street families before the cold season.",
                "category": "Relief",
                "beneficiary": "150 elderly residents and street families in the district.",
                "goal_amount": 80000,
                "end_date": date.today() - timedelta(days=5),
            },
        ]

        created_campaigns = []
        for spec in campaigns_spec:
            campaign = DonationCampaign(
                title=spec["title"], description=spec["description"], category=spec["category"],
                beneficiary=spec["beneficiary"], goal_amount=spec["goal_amount"], end_date=spec["end_date"],
                created_by_id=head_admin.id, is_active=spec["end_date"] is None or spec["end_date"] >= date.today(),
            )
            db.add(campaign)
            db.flush()
            created_campaigns.append(campaign)
        db.commit()

        donation_messages = [
            "Happy to support this cause!", "Keep up the great work.", None, "In memory of my grandmother.", None,
        ]
        for donor in donors:
            for campaign in random.sample(created_campaigns, k=min(3, len(created_campaigns))):
                amount = random.choice([500, 1000, 2500, 5000, 10000])
                status = random.choices(
                    [DonationStatus.APPROVED, DonationStatus.PENDING, DonationStatus.REJECTED],
                    weights=[0.6, 0.3, 0.1],
                )[0]
                donation = Donation(
                    donor_id=donor.id, campaign_id=campaign.id, amount=amount,
                    message=random.choice(donation_messages), status=status,
                )
                if status != DonationStatus.PENDING:
                    donation.reviewed_by_id = mod1.id
                    donation.reviewed_at = now()
                    if status == DonationStatus.REJECTED:
                        donation.rejection_reason = "Payment reference could not be verified."
                db.add(donation)
        db.commit()

        # ---------------------------------------------------------------
        # Forum
        # ---------------------------------------------------------------
        forum_categories_spec = [
            ("General Discussion", "Say hello and talk about anything NGO-LMS related."),
            ("Web Development", "Questions and help for the Web Development course."),
            ("NGO Announcements", "Official updates from the Head Admin and Moderator team."),
            ("Career Guidance", "Advice on jobs, internships, and career paths."),
            ("Technical Support", "Having trouble with the platform? Ask here."),
        ]
        forum_categories = []
        for name, desc in forum_categories_spec:
            existing = db.query(ForumCategory).filter(ForumCategory.name == name).first()
            if existing:
                forum_categories.append(existing)
                continue
            fc = ForumCategory(name=name, description=desc, created_by_id=head_admin.id)
            db.add(fc)
            db.flush()
            forum_categories.append(fc)
        db.commit()

        posts_spec = [
            {
                "category": forum_categories[2], "author": head_admin, "pinned": True, "locked": False,
                "title": "Welcome to the new NGO LMS community forum!",
                "body": "This is our new space to ask questions, share progress, and support each other. Please be respectful and keep discussions on-topic. Excited to see this community grow!",
                "replies": [(students[0], "This is great, thank you for building this!"), (donors[0], "Love seeing this level of transparency.")],
            },
            {
                "category": forum_categories[1], "author": students[1], "pinned": False, "locked": False,
                "title": "Struggling with Flexbox - any tips?",
                "body": "I've gone through the CSS module twice but I still can't get my navbar to align properly with Flexbox. Anyone have a good mental model for this?",
                "replies": [
                    (inst1, "Think of the parent as the flex container - justify-content controls the main axis, align-items controls the cross axis. Try it on a small example first!"),
                    (students[2], "This helped me a lot too, thanks for asking!"),
                ],
            },
            {
                "category": forum_categories[3], "author": students[3], "pinned": False, "locked": False,
                "title": "Does completing the Data Skills course help with NGO job applications?",
                "body": "Curious if anyone has used this certificate when applying for M&E (Monitoring & Evaluation) roles at other NGOs.",
                "replies": [(mod2, "Yes! We've had a few alumni mention it helped them stand out. Happy to share sample resume language if useful.")],
            },
            {
                "category": forum_categories[4], "author": students[4], "pinned": False, "locked": True,
                "title": "[Resolved] Certificate download button not working",
                "body": "The print button on my certificate page wasn't opening the print dialog on my phone. Update: turned out to be a browser issue, works fine on desktop.",
                "replies": [(mod1, "Thanks for the update - closing this thread since it's resolved.")],
            },
            {
                "category": forum_categories[0], "author": students[5], "pinned": False, "locked": False,
                "title": "Introduce yourself!",
                "body": "Starting this thread so new learners can say hi and share what brought them here.",
                "replies": [(students[6], "Hi all! Joined to build some tech skills alongside my volunteering."), (students[7], "Here to learn data skills for our field reports.")],
            },
        ]

        for spec in posts_spec:
            post = ForumPost(
                category_id=spec["category"].id, author_id=spec["author"].id, title=spec["title"], body=spec["body"],
                is_pinned=spec["pinned"], is_locked=spec["locked"],
                view_count=random.randint(5, 80),
            )
            db.add(post)
            db.flush()
            for author, body in spec["replies"]:
                db.add(ForumReply(post_id=post.id, author_id=author.id, body=body))
            for liker in random.sample(students + donors, k=random.randint(1, 4)):
                db.add(ForumPostLike(post_id=post.id, user_id=liker.id))
        db.commit()

        # ---------------------------------------------------------------
        # Blog
        # ---------------------------------------------------------------
        from app.models.blog import slugify

        blogs_spec = [
            {
                "author": inst1, "status": BlogStatus.PUBLISHED, "category": "Web Development", "tags": "html,css,beginners",
                "title": "5 Mistakes Beginners Make When Learning HTML & CSS",
                "content": (
                    "Starting out in web development is exciting, but a few common habits slow learners down more "
                    "than anything else. In this post I'll walk through the five mistakes I see most often in our "
                    "Foundations of Web Development course, and how to fix each one.\n\n"
                    "1. Skipping semantic HTML and reaching for divs for everything.\n"
                    "2. Fighting the box model instead of understanding it.\n"
                    "3. Trying to memorize CSS instead of experimenting in the browser.\n"
                    "4. Not testing on mobile screen sizes early.\n"
                    "5. Copy-pasting code without reading what it does.\n\n"
                    "None of these are fatal - they're just habits, and habits can be replaced with better ones. "
                    "Take it one lesson at a time and you'll get there."
                ),
            },
            {
                "author": inst2, "status": BlogStatus.PUBLISHED, "category": "Data Skills", "tags": "data,ngo,impact",
                "title": "Why Every NGO Volunteer Should Learn Basic Spreadsheets",
                "content": (
                    "Data doesn't have to mean complicated dashboards. For most community organisations, a clean "
                    "spreadsheet is enough to track attendance, measure program impact, and make the case for more "
                    "funding. This post covers three spreadsheet habits that make the biggest difference: consistent "
                    "column headers, one row per record, and always keeping a backup copy before editing.\n\n"
                    "Small, consistent habits like these save hours down the line when it's time to report back to "
                    "donors or plan the next phase of a project."
                ),
            },
            {
                "author": students[2], "status": BlogStatus.PUBLISHED, "category": "Community Leadership", "tags": "volunteering,leadership",
                "title": "What Leading My First Community Cleanup Taught Me",
                "content": (
                    "I signed up to help organise a neighbourhood cleanup thinking it would be simple: get people, "
                    "get bags, pick up trash. It wasn't that simple, and that was the best part.\n\n"
                    "The biggest lesson was that people show up for community, not chores. Once we reframed the "
                    "event around a shared breakfast and music, turnout tripled. Small logistics - like having "
                    "enough gloves for latecomers - mattered more than I expected too."
                ),
            },
            {
                "author": students[5], "status": BlogStatus.PENDING, "category": "Health & Wellness", "tags": "health,volunteering",
                "title": "My First Week as a Community Health Volunteer",
                "content": (
                    "This week I shadowed our senior health workers on home visits. What surprised me most was how "
                    "much of the work is about listening first - people are far more open to health advice once "
                    "they feel heard. Sharing a few reflections here as I get more comfortable in the role."
                ),
            },
            {
                "author": students[6], "status": BlogStatus.DRAFT, "category": "Career Guidance", "tags": "career",
                "title": "How This Platform Helped Me Land My First Internship (Draft)",
                "content": "Still writing this one up - will include the certificate I earned and how I referenced it in interviews.",
            },
            {
                "author": students[7], "status": BlogStatus.REJECTED, "category": "General", "tags": "",
                "title": "Random thoughts",
                "content": "Quick post about my day.",
                "rejection_reason": "This reads more like a personal note than a blog post - happy to review again if you add more detail or a clearer takeaway for readers.",
            },
        ]

        blog_objs = []
        for spec in blogs_spec:
            blog = Blog(
                author_id=spec["author"].id, title=spec["title"], slug=slugify(spec["title"]),
                content=spec["content"], excerpt=spec["content"][:180], category=spec["category"],
                tags=spec["tags"], status=spec["status"], view_count=random.randint(10, 300),
            )
            if spec["status"] == BlogStatus.PUBLISHED:
                blog.published_at = now() - timedelta(days=random.randint(1, 30))
                blog.reviewed_by_id = mod1.id
                blog.reviewed_at = blog.published_at
            elif spec["status"] == BlogStatus.REJECTED:
                blog.reviewed_by_id = mod2.id
                blog.reviewed_at = now() - timedelta(days=2)
                blog.rejection_reason = spec.get("rejection_reason")
            db.add(blog)
            db.flush()
            blog_objs.append(blog)

        db.commit()

        comments_pool = [
            "Really useful, thank you for writing this!", "This matches my experience exactly.",
            "Would love a follow-up post on this topic.", "Great breakdown, saving this for later.",
        ]
        for blog in blog_objs:
            if blog.status != BlogStatus.PUBLISHED:
                continue
            for commenter in random.sample(students, k=random.randint(1, 3)):
                db.add(BlogComment(blog_id=blog.id, author_id=commenter.id, body=random.choice(comments_pool)))
            for liker in random.sample(students + donors, k=random.randint(2, 5)):
                db.add(BlogLike(blog_id=blog.id, user_id=liker.id))
        db.commit()

        print("[seed_demo_data] Done!")
        print(f"[seed_demo_data] Every demo user's password is: {DEMO_PASSWORD}")
        print("[seed_demo_data] Sample logins:")
        print(f"  Head Admin  -> {head_admin.email}")
        print(f"  Moderator   -> {mod1.email}")
        print(f"  Instructor  -> {inst1.email}")
        print(f"  Student     -> {MARKER_EMAIL}")
        print(f"  Donor       -> {donors[0].email}")

    finally:
        db.close()


if __name__ == "__main__":
    run()