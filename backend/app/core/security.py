# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt
from app.core.config import settings

# Setup bcrypt for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a plain password matches the hashed one in the database."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password for storage."""
    return pwd_context.hash(password)

def create_access_token(subject: str, role: str, plan_tier: str) -> str:
    """Generates the JWT token containing user identity and access levels."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # The payload we discussed earlier
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "plan": plan_tier
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt