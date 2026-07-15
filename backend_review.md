# Backend Code Review — Driving School API

Full review of all backend source files. Organized by severity.

---

## Executive Summary

Code is **solid for an MVP auth system**. Architecture follows DDD layering correctly. OTP flow is well-implemented with brute-force lockout, bcrypt hashing, expiry enforcement, and background email sending. No critical security vulnerabilities found in the code itself.

**3 issues need immediate action.** 6 issues are important. Several README files are stale.

---

## 🔴 Critical Issues (Fix Before Next Feature)

### C1. `echo=True` in production DB engine

[session.py L6](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/db/session.py#L6)

```python
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True)
```

`echo=True` logs **every SQL statement** to stdout. In production on Render, this means:
- All queries are written to Render logs (performance cost).
- Potential PII leakage (email addresses in `WHERE` clauses).
- Violates GDPR Art. 25 (privacy by design).

**Fix:** Make it configurable:
```python
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=settings.DB_ECHO)
```
Add `DB_ECHO: bool = False` to [config.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/config.py).

---

### C2. `resend-code` endpoint missing docstring

[auth.py L159-170](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/api/v1/endpoints/auth.py#L159-L170)

The `resend_code` function has no docstring. Confirmed in the live OpenAPI spec — the `/resend-code` endpoint has no `description` field. All other endpoints have full docstrings. This violates the OpenAPI contract consistency.

**Fix:** Add docstring:
```python
async def resend_code(...):
    """
    Generate a fresh OTP and re-send the verification email.

    Rate limit: 1 request per minute per IP (prevents email spam).
    Overwrites the previous code — only one active OTP per user at any time.
    Resets the failed_verify_attempts counter.
    """
```

---

### C3. Cached `openapi.json` is stale

[openapi.json](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/agent_tools/coding_tools/openapi.json) is out of sync with production:
- Missing `/health` endpoints (GET + HEAD).
- Title says `"Driving School Local Test"` (local env) vs production `"Driving School API"`.
- `/resend-code` has a description in cached file but NOT in live (because cached was generated from an older code revision that had the docstring).

**Fix:** Re-run `python agent_tools/coding_tools/fetch_backend_docs.py` against the live server, or update to fetch from production URL.

---

## 🟡 Important Issues (Fix Soon)

### I1. `user_model.py` has wrong header comment

[user_model.py L1](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/models/user_model.py#L1)

```python
# backend/app/models/user.py  ← wrong filename
```
File is `user_model.py`. Minor but confuses agents and developers.

---

### I2. No password strength validation

[user_schema.py L21](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/schemas/user_schema.py#L21)

```python
class UserCreate(UserBase):
    password: str  # No constraints
```

Accepts any string. Single character. Empty string. No length minimum, no complexity check. Before payments, enforce at minimum:
```python
password: str = Field(..., min_length=8, max_length=128)
```
Consider adding a Pydantic validator for basic strength (uppercase + number).

---

### I3. `role` and `plan_tier` are free-text strings

[user_model.py L16-17](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/models/user_model.py#L16-L17)

```python
role = Column(String, default="student", nullable=False)
plan_tier = Column(String, default="free", nullable=False)
```

No enum constraint. A bug or API misuse could set `role = "superadmin"` or `plan_tier = "platinum"`. Before payment integration, use `Enum` types:

```python
from enum import Enum as PyEnum

class UserRole(str, PyEnum):
    student = "student"
    instructor = "instructor"
    admin = "admin"

class PlanTier(str, PyEnum):
    free = "free"
    basic = "basic"
    premium = "premium"
```

Apply to both the SQLAlchemy model and Pydantic schemas. Requires an Alembic migration.

---

### I4. No `__init__.py` in `api/v1/endpoints/`

[endpoints/](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/api/v1/endpoints/) has no `__init__.py`. Works now because Python 3 supports namespace packages. But explicit is better than implicit. Add an empty `__init__.py` for clarity.

---

### I5. `user_id` in JWT is UUID — `TokenPayload.sub` is `str | None`

[user_schema.py L60](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/schemas/user_schema.py#L60)

```python
class TokenPayload(BaseModel):
    sub: str | None = None
```

[dependencies.py L66](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/dependencies.py#L66)

```python
query = select(User).where(User.id == token_data.sub)
```

`User.id` is `UUID`. `token_data.sub` is `str`. SQLAlchemy handles the cast, but this is fragile. Validate explicitly:

```python
from uuid import UUID
sub: UUID | None = None
```

Or cast in the dependency. This prevents a malformed JWT `sub` from hitting the DB with an invalid comparison.

---

### I6. `logout` endpoint returns `Response` but also `MessageResponse`

[auth.py L176-195](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/api/v1/endpoints/auth.py#L176-L195)

```python
@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    response.delete_cookie(...)
    return {"message": "Logged out successfully."}
```

This works, but `response` here is the *injected* response object (via FastAPI DI), not a `JSONResponse`. Cookie deletion happens on the `response` that FastAPI creates from the return dict. This is correct behavior in FastAPI. No bug. But worth a comment for clarity.

---

## 🟢 Observations (No Action Required Now)

### O1. Rate limiter uses in-memory storage

[limiter.py L8-9](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/limiter.py#L8-L9) documents this:

> Storage: in-memory (resets on restart). Redis will be introduced in a future update.

Acceptable for single-instance Render. Before scaling to multiple instances, add Redis.

### O2. `is_active` is `nullable=True` in migration, `nullable not set` in model

[user_model.py L18](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/models/user_model.py#L18): `is_active = Column(Boolean, default=True)` — no `nullable=False`.
[migration L32](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/alembic/versions/c1997413f93b_create_initial_users_table.py#L32): `nullable=True`.

Not a bug (default fills it), but inconsistent. Add `nullable=False` to the model for explicitness.

### O3. `email_srv` re-raises exceptions

[email_srv.py L152](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/services/email_srv.py#L152): `raise` after logging. Correct behavior — FastAPI BackgroundTask will log the traceback. User already received 201/200. No user-facing impact.

### O4. `create_access_token` accepts `subject` as generic `str`

[security.py L50](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/security.py#L50): `subject: str`. Caller passes `user.id` (UUID). `str(subject)` handles it. Works, but typing as `str | UUID` is more honest.

### O5. OpenAPI contract is stable

Live production OpenAPI schema matches code exactly. All schemas (`UserCreate`, `UserResponse`, `MessageResponse`, `VerifyCodeRequest`, `ResendCodeRequest`) are consistent between Pydantic definitions and the generated spec.

---

## 📄 Documentation Audit (README Drift)

Per the backend skill protocol, every README must accurately describe the real code. Here's the drift analysis:

| README | Status | Issues |
|--------|--------|--------|
| [app/README.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/README.md) | ⚠️ Needs minor update | Build command says `.venv/scripts/activate` — Windows uses `Scripts` (capital S), Linux uses `bin`. Clarify both. |
| [api/README.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/api/README.md) | 🔴 **Stale** | Missing 4 endpoints: `/verify`, `/resend-code`, `/logout`, `/health`. Only documents `/signup` and `/login`. Login description says "returns a signed JWT access token" — now returns HttpOnly cookie. |
| [core/README.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/README.md) | 🔴 **Stale** | Missing `limiter.py` entirely. Missing OTP functions in `security.py` (`generate_6_digit_code`, `hash_verification_code`, `verify_otp_code`). `dependencies.py` description says "extracts Authorization: Bearer header" — now uses dual-mode (cookie + bearer). Missing `get_current_verified_user`. Missing OTP config fields and cookie config in `config.py` description. |
| [db/README.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/db/README.md) | ✅ Accurate | No changes needed. |
| [models/README.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/models/README.md) | 🔴 **Stale** | Missing 4 columns: `is_verified`, `verification_code`, `code_expires_at`, `failed_verify_attempts`. |
| [schemas/README.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/schemas/README.md) | 🔴 **Stale** | Missing 3 schemas: `VerifyCodeRequest`, `ResendCodeRequest`, `MessageResponse`. |
| [services/README.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/services/README.md) | 🔴 **Stale** | Missing `email_srv.py` entirely. Missing `verify_user_code` and `regenerate_code` from `auth_srv.py`. `create_user` description doesn't mention OTP generation or tuple return. |
| [tests/](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/tests/) | ⚠️ Empty | Only `__init__.py`. No README, no tests. |

**Documentation Tier Assessment:** This is a **Tier 2** update (schema + endpoint changes). All 6 stale READMEs must be updated.

---

## 🔒 Security Checklist (per backend skill)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Pydantic input validation | ✅ | All endpoints use typed schemas |
| Parameterized queries (SQLAlchemy ORM) | ✅ | No raw SQL anywhere |
| Password hashing (bcrypt) | ✅ | `passlib[bcrypt]`, cost default 12 |
| Rate limiting on auth endpoints | ✅ | slowapi: signup 3/min, login 5/min, verify 5/min, resend 1/min |
| HttpOnly + Secure + SameSite cookies | ✅ | `COOKIE_SECURE` configurable per env |
| Secrets via env vars (BaseSettings) | ✅ | All in `config.py` via Pydantic BaseSettings |
| `.env` in `.gitignore` | ✅ | Line 19 of `.gitignore` |
| No `create_all` in production | ✅ | Removed. Alembic manages migrations |
| CORS restricted (`allow_origins` not `*`) | ✅ | Uses `settings.CORS_ORIGINS` |
| OTP hashed (not plaintext) | ✅ | bcrypt via `hash_verification_code` |
| OTP brute-force lockout | ✅ | 5 attempts, then code invalidated |
| OTP expiry enforced | ✅ | 10-minute TTL, server-side check |
| No stack traces in client responses | ✅ | HTTPException with safe messages |
| Password not in JWT payload | ✅ | Only `sub`, `role`, `plan` |
| CSPRNG for OTP generation | ✅ | `secrets.randbelow()` |

---

## 💳 Payment Readiness Assessment

Before Stripe integration, these must be addressed:

1. **Enum-constrain `plan_tier`** (I3 above). Payments change this field. Free-text strings are dangerous.
2. **Password strength validation** (I2). Users with payment info need stronger accounts.
3. **Add `updated_at` column** to `User` model. Audit trail for plan changes.
4. **Tests directory is empty.** Payment logic needs integration tests before going live.
5. **Architecture.md** describes a `services/payments/` directory structure (base.py, stripe_srv.py, mock_srv.py). This doesn't exist yet — expected, but the doc is ready.

---

## Recommended Action Order

1. Fix C1 (DB echo) — 2 minutes, high impact.
2. Fix C2 (resend-code docstring) — 1 minute.
3. Fix I2 (password validation) — 5 minutes.
4. Fix I3 (enums for role/plan_tier) — 30 minutes (includes migration).
5. Update all 6 stale READMEs — 20 minutes.
6. Fix C3 (regenerate cached openapi.json) — 2 minutes.
7. Fix I1 (model header comment) — 1 minute.

> [!IMPORTANT]
> Shall I proceed with fixing these issues? I can start with the code fixes (C1, C2, I1, I2) and then update all stale READMEs. Or I can produce a formal implementation plan first if you prefer.
