# backend/app/schemas/user_schema.py
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from uuid import UUID
from datetime import datetime

# ---------------------------------------------------------------------------
# Shared base
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class UserCreate(UserBase):
    """Payload for POST /auth/signup."""
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce at least one uppercase letter and one digit."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        return v

class VerifyCodeRequest(BaseModel):
    """Payload for POST /auth/verify."""
    email: EmailStr
    code: str  # The raw 6-digit string submitted by the user

class ResendCodeRequest(BaseModel):
    """Payload for POST /auth/resend-code."""
    email: EmailStr

# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserResponse(UserBase):
    """Full user profile returned to the client."""
    id: UUID
    role: str
    plan_tier: str
    is_active: bool
    is_verified: bool    # Frontend uses this to gate /verify-pending redirect
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    """Generic response for endpoints that don't return user data."""
    message: str

# ---------------------------------------------------------------------------
# Token + JWT payload (kept for internal use / Swagger Bearer fallback)
# ---------------------------------------------------------------------------

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str | None = None
    role: str | None = None
    plan: str | None = None