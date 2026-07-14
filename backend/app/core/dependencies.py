# backend/app/core/dependencies.py
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.db.session import get_db
from app.models.user_model import User
from app.schemas.user_schema import TokenPayload

# ---------------------------------------------------------------------------
# OAuth2PasswordBearer — kept for Swagger /docs "Authorize" button.
# auto_error=False so we can fall through to cookie extraction manually.
# ---------------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def _extract_token(request: Request, bearer_token: str | None) -> str:
    """
    Dual-mode token extraction:
      1. HttpOnly cookie  → primary (production flow, XSS-safe)
      2. Authorization: Bearer header → fallback (Swagger /docs, dev tools)
    Raises 401 if neither source provides a token.
    """
    token = request.cookies.get("access_token")
    if token:
        return token
    if bearer_token:
        return bearer_token
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    request: Request,
    bearer_token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Decodes the JWT and fetches the matching User from the database.
    Accepts token from HttpOnly cookie (preferred) or Authorization header (fallback).
    Does NOT check is_verified — use get_current_verified_user for that.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = _extract_token(request, bearer_token)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(**payload)
    except JWTError:
        raise credentials_exception

    query = select(User).where(User.id == token_data.sub)
    result = await db.execute(query)
    user = result.scalars().first()

    if user is None:
        raise credentials_exception

    return user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Stricter dependency: user must be authenticated AND email-verified.
    Use on all business endpoints (lessons, payments, quizzes, etc.).
    The /users/me endpoint intentionally uses get_current_user (not this),
    so the frontend can read is_verified=false and redirect to /verify-pending.
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. Complete OTP verification first.",
        )
    return current_user