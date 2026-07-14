# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1.router import api_router

# Import models so Alembic env.py can discover them via Base.metadata
from app.models.user_model import User  # noqa: F401

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# Rate limiting middleware (slowapi)
# Attach limiter to app.state so @limiter.limit() decorators can find it.
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS hardening
#
# CRITICAL: allow_origins must NOT be ["*"] when allow_credentials=True.
# Browsers silently drop Set-Cookie headers when both are set — this is a
# browser security spec requirement (not a bug). CORS_ORIGINS is loaded
# from settings, which reads from the .env file.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,      # Required for HttpOnly cookies to work cross-origin
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root_check():
    return {"status": "healthy", "message": "Driving School API operational"}

# ---------------------------------------------------------------------------
# NOTE: Base.metadata.create_all has been REMOVED.
# Alembic now manages all schema changes via: `alembic upgrade head`
# Run this command before starting the server in any environment.
# ---------------------------------------------------------------------------