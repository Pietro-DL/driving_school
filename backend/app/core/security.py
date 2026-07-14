# backend/app/core/security.py
import secrets
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt
from app.core.config import settings

# ---------------------------------------------------------------------------
# Password hashing (bcrypt)
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a plain password matches the hashed one in the database."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password for storage."""
    return pwd_context.hash(password)

# ---------------------------------------------------------------------------
# OTP generation + hashing
# Reuses the same bcrypt context as passwords — no second hashing scheme.
# ---------------------------------------------------------------------------

def generate_6_digit_code() -> str:
    """
    Generates a cryptographically secure 6-digit numeric string.
    Uses secrets.randbelow() (CSPRNG). random.randint() is NOT safe here.
    Returns a zero-padded string, e.g. '042718'.
    """
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_verification_code(code: str) -> str:
    """Hashes the raw OTP using bcrypt. Never store the raw code."""
    return pwd_context.hash(code)

def verify_otp_code(plain_code: str, hashed_code: str) -> bool:
    """
    Verifies the user-submitted OTP against the stored bcrypt hash.
    Constant-time comparison — safe against timing attacks.
    """
    return pwd_context.verify(plain_code, hashed_code)

# ---------------------------------------------------------------------------
# JWT access tokens
# ---------------------------------------------------------------------------

def create_access_token(subject: str, role: str, plan_tier: str) -> str:
    """Generates a signed JWT containing user identity and access levels."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "plan": plan_tier,
    }

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt