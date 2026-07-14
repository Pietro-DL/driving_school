# backend/app/api/v1/endpoints/auth.py
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user_schema import (
    MessageResponse,
    ResendCodeRequest,
    UserCreate,
    UserResponse,
    VerifyCodeRequest,
)
from app.core import security
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user_model import User
from app.services import auth_srv, email_srv

# slowapi limiter imported from main.py's app.state
# The limiter instance is attached there and referenced here via the decorator.
from app.core.limiter import limiter

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /signup
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def signup(
    request: Request,            # Required by slowapi
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.

    Flow:
      1. Creates the user (unverified) with a hashed OTP.
      2. Fires the verification email as a BackgroundTask (response is instant).
      3. Returns 201 with the user profile (is_verified=false).

    Frontend: After 201, redirect to /verify-pending.
    """
    new_user, raw_code = await auth_srv.create_user(session=db, user_in=user_in)

    if new_user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    # Fire-and-forget: email is sent after response is returned to client
    background_tasks.add_task(email_srv.send_verification_email, new_user.email, raw_code)

    return new_user


# ---------------------------------------------------------------------------
# POST /login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=MessageResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,            # Required by slowapi
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate a user and set an HttpOnly JWT cookie.

    Expects application/x-www-form-urlencoded with fields: username (email) and password.

    Token delivery: HttpOnly cookie (XSS-safe). NOT returned in the response body.
    Swagger /docs fallback: Bearer header still accepted by get_current_user.

    Response body: { "message": "Login successful" }
    Frontend: call GET /users/me with credentials:'include' to hydrate user state.
    """
    user = await auth_srv.authenticate_user(
        session=db,
        email=form_data.username,
        password=form_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    access_token = security.create_access_token(
        subject=user.id,
        role=user.role,
        plan_tier=user.plan_tier,
    )

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,                                       # JavaScript cannot read this
        secure=settings.COOKIE_SECURE,                      # True in prod (HTTPS)
        samesite="lax",                                      # CSRF protection
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Seconds
        domain=settings.COOKIE_DOMAIN,                      # None = inferred from request
    )
    return response


# ---------------------------------------------------------------------------
# POST /verify
# ---------------------------------------------------------------------------

@router.post("/verify", response_model=MessageResponse)
@limiter.limit("5/minute")
async def verify_email(
    request: Request,            # Required by slowapi
    payload: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a user's email address with a 6-digit OTP.

    Security:
      - Brute-force lockout: 5 failed attempts invalidate the code.
      - Time-based expiry: code expires after 10 minutes.
      - One-time use: code and expiry are cleared after successful verification.

    Frontend: On success, redirect to /dashboard (or call GET /users/me to refresh state).
    """
    await auth_srv.verify_user_code(
        session=db,
        email=payload.email,
        code=payload.code,
    )
    return {"message": "Email verified successfully. You can now log in."}


# ---------------------------------------------------------------------------
# POST /resend-code
# ---------------------------------------------------------------------------

@router.post("/resend-code", response_model=MessageResponse)
@limiter.limit("1/minute")
async def resend_code(
    request: Request,
    payload: ResendCodeRequest,
    # background_tasks: BackgroundTasks, # COMMENT THIS OUT
    db: AsyncSession = Depends(get_db),
):
    user, raw_code = await auth_srv.regenerate_code(session=db, email=payload.email)
    
    # FORCE EXECUTION HERE
    # Instead of queuing it, we await it directly.
    # If this fails, the endpoint will return 500 and show us the exact error.
    await email_srv.send_verification_email(user.email, raw_code) 
    
    return {"message": "A new verification code has been sent to your email."}

# ---------------------------------------------------------------------------
# POST /logout
# ---------------------------------------------------------------------------

@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    """
    Clear the HttpOnly auth cookie server-side.

    HttpOnly cookies cannot be deleted by JavaScript, so this endpoint is
    required for proper logout. The current_user dependency ensures only
    an authenticated session can trigger cookie deletion (prevents logout spam).
    """
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        domain=settings.COOKIE_DOMAIN,
    )
    return {"message": "Logged out successfully."}