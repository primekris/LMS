"""
SQLAlchemy engine + session setup.

Works unchanged with SQLite (default, local dev) or Postgres (if you ever
set DATABASE_URL to a postgres:// URL) — no code changes required, only
the .env value.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

database_url = settings.DATABASE_URL
# Render (and some other hosts) hand out "postgres://" URLs, but SQLAlchemy 2.x
# requires the "postgresql://" scheme. Normalize it here so either form works.
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if database_url.startswith("sqlite"):
    # Needed for SQLite when used with FastAPI's threaded request handling.
    connect_args = {"check_same_thread": False}

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
