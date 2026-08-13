import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.routers import assignments, auth, certificates, courses, donations, enrollments, progress, public, quizzes, resources, users, stats
from app.seed import seed_head_admin

# Create tables directly for zero-friction local dev.
# In staging/production, prefer running `alembic upgrade head` instead.
Base.metadata.create_all(bind=engine)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(resources.router)
app.include_router(enrollments.router)
app.include_router(donations.router)
app.include_router(stats.router)
app.include_router(quizzes.router)
app.include_router(assignments.router)
app.include_router(certificates.router)
app.include_router(progress.router)
app.include_router(public.router)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_head_admin(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
