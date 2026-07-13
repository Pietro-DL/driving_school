# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to return to client
class UserResponse(UserBase):
    id: UUID
    role: str
    plan_tier: str
    is_active: bool
    created_at: datetime
    
    # Enables compatibility with SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)

# Token schemas for Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str | None = None
    role: str | None = None
    plan: str | None = None