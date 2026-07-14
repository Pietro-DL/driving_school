# backend/app/services/auth_srv.py
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.user_model import User
from app.schemas.user_schema import UserCreate
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    generate_6_digit_code,
    hash_verification_code,
    verify_otp_code,
)

# ---------------------------------------------------------------------------
# User creation
# ---------------------------------------------------------------------------

async def create_user(
    session: AsyncSession, user_in: UserCreate
) -> tuple[User, str] | tuple[None, None]:
    """
    Creates a new unverified user with a hashed OTP.

    Returns:
        (User, raw_code) on success — raw_code must be emailed, never stored.
        (None, None)     if the email is already registered.
    """
    # 1. Duplicate check
    query = select(User).where(User.email == user_in.email)
    result = await session.execute(query)
    if result.scalars().first():
        return None, None

    # 2. Hash password
    hashed_password = get_password_hash(user_in.password)

    # 3. Generate OTP — timestamp assigned HERE (service layer), not in security.py
    raw_code = generate_6_digit_code()
    hashed_code = hash_verification_code(raw_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    # 4. Build model instance
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role="student",
        plan_tier="free",
        is_verified=False,
        verification_code=hashed_code,
        code_expires_at=expires_at,
        failed_verify_attempts=0,
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user, raw_code


# ---------------------------------------------------------------------------
# OTP verification
# ---------------------------------------------------------------------------

async def verify_user_code(
    session: AsyncSession, email: str, code: str
) -> User:
    """
    Validates the OTP submitted by the user.

    Security rules enforced:
      - Code must not be expired (code_expires_at > now).
      - Max OTP_MAX_ATTEMPTS failures before code is invalidated (brute-force lock).
      - On success: is_verified=True, code fields cleared, counter reset.
      - On failure: failed_verify_attempts incremented; invalidated at threshold.

    Raises HTTPException on any failure.
    Returns the updated User on success.
    """
    # 1. Find the user
    query = select(User).where(User.email == email)
    result = await session.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email address.",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified.",
        )

    # 2. Check if code has been invalidated (too many failures)
    if user.verification_code is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has been invalidated. Request a new one.",
        )

    # 3. Check expiry
    if user.code_expires_at is None or datetime.now(timezone.utc) > user.code_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Request a new one.",
        )

    # 4. Brute-force lockout check (before verifying to prevent timing oracle)
    if user.failed_verify_attempts >= settings.OTP_MAX_ATTEMPTS:
        # Invalidate the code
        user.verification_code = None
        user.code_expires_at = None
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Too many incorrect attempts. "
                f"Verification code invalidated. Request a new one."
            ),
        )

    # 5. Verify the code
    if not verify_otp_code(code, user.verification_code):
        user.failed_verify_attempts += 1
        remaining = settings.OTP_MAX_ATTEMPTS - user.failed_verify_attempts

        # If this failure hits the threshold, invalidate immediately
        if remaining <= 0:
            user.verification_code = None
            user.code_expires_at = None
            await session.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Verification code invalidated. Request a new one.",
            )

        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining.",
        )

    # 6. Success — verify the user and clear the OTP fields
    user.is_verified = True
    user.verification_code = None
    user.code_expires_at = None
    user.failed_verify_attempts = 0
    await session.commit()
    await session.refresh(user)

    return user


# ---------------------------------------------------------------------------
# Code regeneration
# ---------------------------------------------------------------------------

async def regenerate_code(
    session: AsyncSession, email: str
) -> tuple[User, str]:
    """
    Generates a fresh OTP for an existing unverified user.
    Overwrites the previous code — only one active code per user at any time.
    Resets the failed_verify_attempts counter.

    Raises HTTPException if user not found or already verified.
    Returns (User, raw_code).
    """
    query = select(User).where(User.email == email)
    result = await session.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email address.",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified.",
        )

    raw_code = generate_6_digit_code()
    user.verification_code = hash_verification_code(raw_code)
    user.code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    user.failed_verify_attempts = 0

    await session.commit()
    await session.refresh(user)

    return user, raw_code


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

async def authenticate_user(
    session: AsyncSession, email: str, password: str
) -> User | None:
    """
    Verifies email + password.
    Returns the User object on success, None on any failure.

    Deliberately does NOT check is_verified. The /login endpoint issues
    the HttpOnly cookie for ANY user with valid credentials so the
    frontend can call GET /users/me, read is_verified=false, and redirect
    to /verify-pending. Business endpoints use get_current_verified_user
    to enforce the verification gate.
    """
    query = select(User).where(User.email == email)
    result = await session.execute(query)
    user = result.scalars().first()

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user