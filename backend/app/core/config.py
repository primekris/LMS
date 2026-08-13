"""
Application configuration.

All environment-specific values live here and are read from environment
variables (via a local .env file in development). This is the ONLY file
that should change between localhost / Render / Railway / Replit — the
rest of the codebase never needs to know which environment it's running in.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "NGO LMS"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database (SQLite by default; swap DATABASE_URL to use Postgres etc.)
    DATABASE_URL: str = "sqlite:///./ngo_lms.db"

    # JWT
    SECRET_KEY: str = "insecure-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Storage
    STORAGE_DRIVER: str = "local"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 200

    # Head admin seed
    HEAD_ADMIN_EMAIL: str = "admin@ngo-lms.org"
    HEAD_ADMIN_PASSWORD: str = "ChangeMe123!"
    HEAD_ADMIN_NAME: str = "Head Admin"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
