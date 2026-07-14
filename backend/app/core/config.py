# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Driving School API"

    # ---------------------------------------------------------------------------
    # Database
    # ---------------------------------------------------------------------------
    SQLALCHEMY_DATABASE_URI: str

    # ---------------------------------------------------------------------------
    # Security / JWT
    # ---------------------------------------------------------------------------
    SECRET_KEY: str         # Generate with: openssl rand -hex 32
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ---------------------------------------------------------------------------
    # OTP
    # ---------------------------------------------------------------------------
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5   # Attempts before code is invalidated

    # ---------------------------------------------------------------------------
    # Email (SMTP via SendGrid or Resend SMTP relay)
    # For SendGrid: SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey
    # For Resend:   SMTP_HOST=smtp.resend.com,   SMTP_USER=resend
    # ---------------------------------------------------------------------------
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""             # SendGrid API key / Resend API key
    EMAILS_FROM_EMAIL: str = "noreply@scuolaguida.it"
    EMAILS_FROM_NAME: str = "Scuola Guida"

    # ---------------------------------------------------------------------------
    # CORS
    # Set CORS_ORIGINS in production .env as a JSON array string:
    # CORS_ORIGINS='["https://scuolaguida-frontend.onrender.com"]'
    # ---------------------------------------------------------------------------
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ---------------------------------------------------------------------------
    # Cookie
    # COOKIE_SECURE must be True in production (HTTPS). False for local HTTP.
    # ---------------------------------------------------------------------------
    COOKIE_SECURE: bool = False
    COOKIE_DOMAIN: str | None = None  # None = browser infers from request domain

    class Config:
        env_file = ".env"

settings = Settings()