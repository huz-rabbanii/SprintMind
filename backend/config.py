from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "TaskFlow AI"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://taskflow:taskflow@localhost:5432/taskflow"

    # JWT
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # GitHub OAuth + API
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_WEBHOOK_SECRET: str = ""

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""


settings = Settings()
