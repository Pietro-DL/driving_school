# backend\app\core\README.md

This directory contains all files for application configuration, security utilities, authentication dependencies, and rate limiting.

## File Glossary & Breakdown

### `config.py`
Pydantic `BaseSettings` singleton. Loads all environment variables from `.env`. Sections:
- **Database:** `SQLALCHEMY_DATABASE_URI`, `DB_ECHO` (default False — must stay False in prod to avoid PII leakage).
- **Security / JWT:** `SECRET_KEY`, `ALGORITHM` (HS256), `ACCESS_TOKEN_EXPIRE_MINUTES` (7 days).
- **OTP:** `OTP_EXPIRE_MINUTES` (10), `OTP_MAX_ATTEMPTS` (5 failures before invalidation).
- **Email (SMTP):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME`.
- **CORS:** `CORS_ORIGINS` (JSON array from env). Must NOT be `["*"]` when `allow_credentials=True`.
- **Cookie:** `COOKIE_SECURE` (True in prod for HTTPS), `COOKIE_DOMAIN`.

### `security.py`
Cryptographic utilities. All use `passlib[bcrypt]` via a shared `CryptContext`:
- `verify_password(plain, hashed)` — Compares login password against stored hash.
- `get_password_hash(password)` — Hashes password for storage.
- `generate_6_digit_code()` — CSPRNG-backed OTP via `secrets.randbelow()`.
- `hash_verification_code(code)` — Bcrypt-hashes the raw OTP before storing.
- `verify_otp_code(plain_code, hashed_code)` — Constant-time bcrypt comparison for OTP verification.
- `create_access_token(subject, role, plan_tier)` — Generates signed JWT with `sub`, `role`, `plan`, `exp` claims.

### `dependencies.py`
FastAPI dependency injection functions for authentication:
- `_extract_token(request, bearer_token)` — Dual-mode token extraction. Checks HttpOnly cookie first (production flow), falls back to `Authorization: Bearer` header (Swagger /docs fallback).
- `get_current_user(request, bearer_token, db)` — Decodes JWT, fetches User from DB. Does NOT check `is_verified`. Use for endpoints that unverified users need (e.g., `/users/me`).
- `get_current_verified_user(current_user)` — Stricter dependency. User must be authenticated AND email-verified. Use on all business endpoints (lessons, payments, quizzes).

### `limiter.py`
Centralized `slowapi.Limiter` instance. Defined here (not in `main.py`) to avoid circular imports. Endpoint modules import and decorate with `@limiter.limit(...)`. Storage: in-memory (resets on restart). Redis planned for multi-instance deployments.
