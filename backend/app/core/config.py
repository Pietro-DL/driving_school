# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Driving School API"
    
    # Database
    SQLALCHEMY_DATABASE_URI: str
    
    # Security
    SECRET_KEY: str  # e.g., run `openssl rand -hex 32` to generate this
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    class Config:
        env_file = ".env"

settings = Settings()