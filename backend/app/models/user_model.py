# backend/app/models/user_model.py
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    # --- Base user metadata ---
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String, default="student", nullable=False)
    plan_tier = Column(String, default="free", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- OTP Verification ---
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_code = Column(String, nullable=True)         # Stores bcrypt-hashed 6-digit OTP
    code_expires_at = Column(DateTime(timezone=True), nullable=True)
    failed_verify_attempts = Column(Integer, default=0, nullable=False)  # Brute-force counter