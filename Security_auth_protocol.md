# Security Auth Protocol — Refined Implementation Plan

Refined version of [Security_auth_protocol.md](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/Security_auth_protocol.md). Organized by backend layer, with specific file-level changes, rationale, and frontend consequences.

---

## User Review Required

> [!IMPORTANT]
> **SMTP Provider Choice.** Email sending requires an external provider. SendGrid has a free tier (100 emails/day). Mailgun and AWS SES also work. Which provider do you prefer? This determines the SDK added to `requirements.txt` and the env vars in `config.py`.

> [!WARNING]
> **HttpOnly Cookie + OAuth2PasswordBearer conflict.** Currently [dependencies.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/dependencies.py#L14) uses `OAuth2PasswordBearer`, which reads the token from the `Authorization: Bearer` header. Switching to HttpOnly cookies means the token arrives in the `Cookie` header instead. This breaks the Swagger UI `/docs` "Authorize" button. Two options:
> 1. **Cookie-only**: Simpler, safer. Swagger login broken (use Postman/curl for dev).
> 2. **Dual-mode**: Accept both Cookie and Bearer header. Swagger works, slightly more complex code.

> [!CAUTION]
> **Breaking change for frontend.** The login response body changes. Currently returns `{ access_token, token_type }`. With HttpOnly cookies, the token moves to a `Set-Cookie` header. Frontend must stop storing the token in React state and instead rely on `credentials: "include"` in every `fetch()` call. This impacts every file in `src/api/` and `src/contexts/`.

---

## Open Questions

1. **Rate limiter storage backend?** `slowapi` defaults to in-memory storage. Resets on server restart. For Render with multiple instances, need Redis. Do you have a Redis instance provisioned?
2. **OTP brute-force lockout?** After N failed verify attempts (e.g., 5), should the code be invalidated entirely? The current protocol doesn't specify this.
3. **Alembic now or later?** `alembic` is already in [requirements.txt](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/requirements.txt#L5) but not initialized. Should we initialize it in this phase, or keep `create_all` for local dev and set up Alembic in the Render deployment phase?
4. **Logout endpoint?** With HttpOnly cookies, `logout` requires a backend `POST /api/v1/auth/logout` to clear the cookie. Currently logout is frontend-only (wipes React state). Should we add this endpoint now?

---

## Proposed Changes

Changes organized bottom-up: DB → Core → Services → Endpoints → Middleware → Frontend.

---

### Layer 1: Database Model (`models/`)

#### [MODIFY] [user_model.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/models/user_model.py)

**What changes:** Add 3 new columns for OTP verification state.

```diff
 class User(Base):
     __tablename__ = "users"
 
     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
     email = Column(String, unique=True, index=True, nullable=False)
     hashed_password = Column(String, nullable=False)
     first_name = Column(String, nullable=False)
     last_name = Column(String, nullable=False)
     role = Column(String, default="student", nullable=False)
     plan_tier = Column(String, default="free", nullable=False)
     is_active = Column(Boolean, default=True)
     created_at = Column(DateTime(timezone=True), server_default=func.now())
+
+    # --- OTP Verification ---
+    is_verified = Column(Boolean, default=False, nullable=False)
+    verification_code = Column(String, nullable=True)
+    code_expires_at = Column(DateTime(timezone=True), nullable=True)
```

**Why:**
- `is_verified` defaults to `False`. Unverified users cannot access protected routes.
- `verification_code` stores the **hashed** OTP (never plaintext). Same principle as passwords.
- `code_expires_at` enforces the 10-minute TTL. Server compares `datetime.now(UTC) < code_expires_at` before accepting a code.

**Consequence:** Alembic migration required for production DB. For local dev, `create_all` handles it if you drop/recreate the DB.

---

### Layer 2: Schemas (`schemas/`)

#### [MODIFY] [user_schema.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/schemas/user_schema.py)

**What changes:** Add `is_verified` to `UserResponse`. Add 2 new request schemas for OTP endpoints. Modify `Token` for cookie mode.

```diff
 class UserResponse(UserBase):
     id: UUID
     role: str
     plan_tier: str
     is_active: bool
+    is_verified: bool
     created_at: datetime
     model_config = ConfigDict(from_attributes=True)

+# --- OTP Verification Schemas ---
+class VerifyCodeRequest(BaseModel):
+    email: EmailStr
+    code: str  # The 6-digit string from the user

+class ResendCodeRequest(BaseModel):
+    email: EmailStr

+class MessageResponse(BaseModel):
+    message: str  # Generic success message for non-data endpoints
```

**Why:**
- `UserResponse` must expose `is_verified` so the frontend knows whether to redirect to `/verify-pending`.
- `VerifyCodeRequest` / `ResendCodeRequest` are dedicated schemas. Prevents abusing `UserCreate` for unrelated purposes.
- `MessageResponse` gives a typed response for endpoints that return `{ "message": "..." }` instead of user data.

---

### Layer 3: Core Security (`core/`)

#### [MODIFY] [security.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/security.py)

**What changes:** Add OTP generation function and OTP hash/verify functions.

```python
# New imports
import secrets

def generate_6_digit_code() -> str:
    """Generates a cryptographically secure 6-digit numeric string."""
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_verification_code(code: str) -> str:
    """Hashes the OTP using the same bcrypt context as passwords."""
    return pwd_context.hash(code)

def verify_code(plain_code: str, hashed_code: str) -> bool:
    """Verifies the user-submitted code against the stored hash."""
    return pwd_context.verify(plain_code, hashed_code)
```

**Why:**
- `secrets.randbelow()` is CSPRNG-backed. `random.randint()` is NOT cryptographically secure.
- Reusing `pwd_context` (bcrypt) for code hashing avoids introducing a second hashing scheme.
- Separate `hash_verification_code` / `verify_code` functions keep the API surface explicit.

> [!NOTE]
> **Protocol doc refinement.** Your original protocol puts `code_expires_at` logic inside `generate_6_digit_code()`. This violates separation of concerns. The generation function should only generate. The timestamp assignment belongs in the service layer (`auth_srv.py`), where the DB write happens.

#### [MODIFY] [config.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/config.py)

**What changes:** Add env vars for email service, CORS origins, rate limiting, cookie config.

```diff
 class Settings(BaseSettings):
     PROJECT_NAME: str = "Driving School API"
     SQLALCHEMY_DATABASE_URI: str
     SECRET_KEY: str
     ALGORITHM: str = "HS256"
     ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
+
+    # --- OTP ---
+    OTP_EXPIRE_MINUTES: int = 10
+
+    # --- Email (SMTP) ---
+    SMTP_HOST: str = ""
+    SMTP_PORT: int = 587
+    SMTP_USER: str = ""
+    SMTP_PASSWORD: str = ""
+    EMAILS_FROM_EMAIL: str = "noreply@scuolaguida.it"
+    EMAILS_FROM_NAME: str = "Scuola Guida"
+
+    # --- CORS ---
+    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
+
+    # --- Cookie ---
+    COOKIE_DOMAIN: str | None = None  # None = browser uses request domain
+    COOKIE_SECURE: bool = False       # True in production (HTTPS only)
 
     class Config:
         env_file = ".env"
```

**Why:**
- All secrets and environment-dependent values must come from env vars. No hardcoded SMTP credentials.
- `CORS_ORIGINS` replaces the hardcoded `["*"]` in [main.py L19](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/main.py#L19).
- `COOKIE_SECURE=False` for local dev (HTTP). `True` in production `.env` on Render (HTTPS).

#### [MODIFY] [dependencies.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/dependencies.py)

**What changes:** Modify `get_current_user` to read JWT from HttpOnly cookie instead of (or in addition to) the `Authorization` header. Add a `get_current_verified_user` dependency that also checks `is_verified`.

```python
# New dependency: extracts JWT from cookie
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, ...)
    # ... same JWT decode logic as before ...

# Stricter dependency: user must also be verified
async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Complete OTP verification first."
        )
    return current_user
```

**Why:**
- Two-tier dependency chain. `get_current_user` only checks authentication (valid JWT). `get_current_verified_user` also checks email verification.
- The `/users/me` endpoint needs `get_current_user` (not verified), so the frontend can read `is_verified` and redirect accordingly.
- Protected business endpoints (dashboard data, lessons, payments) should use `get_current_verified_user`.

---

### Layer 4: Services (`services/`)

#### [MODIFY] [auth_srv.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/services/auth_srv.py)

**What changes:** Modify `create_user` to generate OTP + store hash. Add `verify_user_code` and `regenerate_code` service functions.

```python
async def create_user(session, user_in) -> User | None:
    # ... existing duplicate check ...
    # ... existing password hash + User() creation ...
    
    # NEW: Generate OTP, hash it, set expiry
    raw_code = generate_6_digit_code()
    new_user.verification_code = hash_verification_code(raw_code)
    new_user.code_expires_at = datetime.now(UTC) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    new_user.is_verified = False
    
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    
    return new_user, raw_code  # Return raw code for email sending

async def verify_user_code(session, email, code) -> User:
    """Validates OTP. Returns verified user. Raises on failure."""
    # 1. Find user by email
    # 2. Check code_expires_at > now (not expired)
    # 3. verify_code(code, user.verification_code) (bcrypt compare)
    # 4. Set user.is_verified = True, clear code fields
    # 5. Commit and return user

async def regenerate_code(session, email) -> tuple[User, str]:
    """Generates a new OTP for an existing unverified user."""
    # 1. Find user by email
    # 2. Check user exists and is not already verified
    # 3. Generate new code, hash, update code_expires_at
    # 4. Commit and return (user, raw_code)
```

**Why:**
- `create_user` now returns a tuple `(User, raw_code)`. The raw code is needed to send the email. It is never persisted in plaintext.
- `verify_user_code` clears `verification_code` and `code_expires_at` after success. One-time use.
- `regenerate_code` overwrites the old code. Only 1 active code per user at any time.

> [!NOTE]
> **Protocol refinement: `create_user` return type changes.** The current [auth.py L21](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/api/v1/endpoints/auth.py#L21) uses `new_user = await auth_srv.create_user(...)`. This must be updated to unpack the tuple: `new_user, raw_code = await auth_srv.create_user(...)`.

#### [NEW] [email_srv.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/services/email_srv.py)

**What changes:** New file. Sends the OTP email via SMTP.

```python
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

async def send_verification_email(to_email: str, code: str) -> None:
    """Sends the 6-digit OTP email via SMTP proxy."""
    # 1. Build MIMEMultipart with HTML template containing the code
    # 2. Connect to SMTP_HOST:SMTP_PORT with TLS
    # 3. Authenticate with SMTP_USER / SMTP_PASSWORD
    # 4. Send message
```

**Why:**
- `aiosmtplib` is the async SMTP client. Synchronous `smtplib` blocks the event loop. Critical for FastAPI's async architecture.
- HTML template embedded or loaded from file. Contains the 6-digit code + "expires in 10 minutes" notice.
- This function runs as a `BackgroundTask` from the endpoint, so the API response is instant.

**New dependency:** `aiosmtplib` added to [requirements.txt](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/requirements.txt).

---

### Layer 5: API Endpoints (`api/v1/endpoints/`)

#### [MODIFY] [auth.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/api/v1/endpoints/auth.py)

**What changes:** Modify `signup` to trigger email. Modify `login` to set HttpOnly cookie. Add 2 new endpoints (`/verify`, `/resend-code`). Add logout endpoint.

| Endpoint | Method | Auth Required | New? | Purpose |
|---|---|---|---|---|
| `/api/v1/auth/signup` | POST | No | Modified | Creates user + sends OTP email as BackgroundTask |
| `/api/v1/auth/login` | POST | No | Modified | Sets JWT in HttpOnly cookie instead of response body |
| `/api/v1/auth/verify` | POST | No | **New** | Validates OTP code, marks user verified |
| `/api/v1/auth/resend-code` | POST | No | **New** | Regenerates OTP, re-sends email. Rate-limited |
| `/api/v1/auth/logout` | POST | Yes (cookie) | **New** | Clears the HttpOnly cookie server-side |

**Detailed changes:**

**`POST /signup` — modified:**
```python
@router.post("/signup", response_model=UserResponse, status_code=201)
async def signup(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    new_user, raw_code = await auth_srv.create_user(session=db, user_in=user_in)
    if not new_user:
        raise HTTPException(400, "Email already exists.")
    
    # Fire-and-forget email sending
    background_tasks.add_task(email_srv.send_verification_email, new_user.email, raw_code)
    
    return new_user
```

**`POST /login` — modified:**
```python
@router.post("/login")
async def login(form_data, db):
    user = await auth_srv.authenticate_user(...)
    # ... existing checks ...
    
    access_token = security.create_access_token(...)
    
    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,    # True in prod (HTTPS)
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=settings.COOKIE_DOMAIN,
    )
    return response
```

> [!WARNING]
> **Login response body changes.** No longer returns `{ access_token, token_type }`. Returns `{ message: "Login successful" }`. The JWT lives exclusively in the `Set-Cookie` header. Frontend must update accordingly.

**`POST /verify` — new:**
```python
@router.post("/verify", response_model=MessageResponse)
async def verify_code(payload: VerifyCodeRequest, db):
    await auth_srv.verify_user_code(session=db, email=payload.email, code=payload.code)
    return {"message": "Email verified successfully."}
```

**`POST /resend-code` — new:**
```python
@router.post("/resend-code", response_model=MessageResponse)
async def resend_code(payload: ResendCodeRequest, background_tasks, db):
    user, raw_code = await auth_srv.regenerate_code(session=db, email=payload.email)
    background_tasks.add_task(email_srv.send_verification_email, user.email, raw_code)
    return {"message": "New code sent."}
```

**`POST /logout` — new:**
```python
@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    response.delete_cookie("access_token", ...)
    return {"message": "Logged out."}
```

---

### Layer 6: Middleware & App Config (`main.py`)

#### [MODIFY] [main.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/main.py)

**What changes:** 3 modifications.

**1. CORS hardening:**
```diff
 app.add_middleware(
     CORSMiddleware,
-    allow_origins=["*"],
+    allow_origins=settings.CORS_ORIGINS,
     allow_credentials=True,
     allow_methods=["*"],
     allow_headers=["*"],
 )
```

> [!IMPORTANT]
> `allow_credentials=True` is required for HttpOnly cookies to be sent cross-origin. Combined with a restrictive `allow_origins`, this is safe. With `allow_origins=["*"]` and `allow_credentials=True` — browsers **silently ignore** the `Set-Cookie` header. This is a spec-level prohibition. Must fix CORS before cookies work.

**2. Rate limiting middleware:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

Rate limits applied per-endpoint via decorator:
```python
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
```

| Endpoint | Rate Limit | Reason |
|---|---|---|
| `/signup` | 3/minute | Prevents mass account creation |
| `/login` | 5/minute | Prevents credential stuffing |
| `/verify` | 5/minute | Prevents OTP brute-force (10^6 codes / 5 per min = 200K min to brute-force) |
| `/resend-code` | 1/minute | Prevents email spam |

**New dependency:** `slowapi` added to [requirements.txt](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/requirements.txt).

**3. Alembic migration (replaces `create_all`):**
```diff
-@app.on_event("startup")
-async def startup_event():
-    async with engine.begin() as conn:
-        await conn.run_sync(Base.metadata.create_all)
+# Startup no longer creates tables.
+# Alembic handles migrations: `alembic upgrade head`
```

---

### Layer 7: Dependencies (`requirements.txt`)

#### [MODIFY] [requirements.txt](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/requirements.txt)

```diff
 fastapi
 uvicorn[standard]
 sqlalchemy
 asyncpg
 alembic
 pydantic[email]
 passlib
 bcrypt<4.0.0
 python-jose[cryptography]
 python-multipart
 pydantic_settings
+aiosmtplib
+slowapi
```

---

## Frontend Consequences

### New HTTP Requests (3 new endpoints to call)

| New Frontend Function | Endpoint | Content-Type | Body | Response |
|---|---|---|---|---|
| `verifyCodeRequest(data)` | `POST /api/v1/auth/verify` | `application/json` | `{ email, code }` | `{ message }` |
| `resendCodeRequest(data)` | `POST /api/v1/auth/resend-code` | `application/json` | `{ email }` | `{ message }` |
| `logoutRequest()` | `POST /api/v1/auth/logout` | none | none | `{ message }` |

### Modified HTTP Requests (2 existing endpoints change behavior)

| Function | Change |
|---|---|
| `loginRequest()` | No longer returns `{ access_token, token_type }`. Returns `{ message }`. Must add `credentials: "include"` to `fetch()`. |
| `getMeRequest()` | Remove `Authorization: Bearer` header. Add `credentials: "include"` instead. Browser sends cookie automatically. |
| `signupRequest()` | No wire-level change, but response now includes `is_verified: false` in `UserResponse`. |

---

### Files to Modify (Frontend) — Full Breakdown

#### [MODIFY] [auth.types.ts](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/types/auth.types.ts)

```diff
 export interface UserResponse {
   ...
   is_active: boolean;
+  is_verified: boolean;
   created_at: string;
 }

+export interface VerifyCodeRequest {
+  email: string;
+  code: string;
+}

+export interface ResendCodeRequest {
+  email: string;
+}

+export interface MessageResponse {
+  message: string;
+}
```

#### [MODIFY] [auth.api.ts](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/api/auth.api.ts)

- Add `credentials: "include"` to **every** `fetch()` call (login, getMe, logout, verify, resend).
- `loginRequest()` return type changes from `Token` to `MessageResponse`.
- Remove `accessToken` parameter from `getMeRequest()`. Cookie sent automatically.
- Add 3 new functions: `verifyCodeRequest()`, `resendCodeRequest()`, `logoutRequest()`.

#### [MODIFY] [AuthContext.tsx](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/contexts/AuthContext.tsx)

- Remove `token` from state. Browser manages it via cookie.
- `login()` flow changes: call `loginRequest()` → call `getMeRequest()` → check `is_verified` → redirect to `/dashboard` or `/verify-pending`.
- `logout()` becomes async. Calls `logoutRequest()` to clear server cookie.
- Add `verify()` and `resendCode()` functions to context.
- Add `is_verified === false` case to error mapping.

#### [MODIFY] [ProtectedRoute.tsx](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/components/ProtectedRoute.tsx)

- Add verification gate: if `user && !user.is_verified` → redirect to `/verify-pending`.
- Keep existing behavior: if `!user` → redirect to `/login`.

#### [NEW] `frontend/src/app/verify-pending/page.tsx`

New page. Renders:
- 6-digit input form (6 individual digit boxes).
- 10-minute countdown timer (visual urgency).
- "Resend Code" button. Disabled for 60 seconds after click (client-side throttle + server rate limit).
- Success state → redirect to `/dashboard`.

#### [NEW] `frontend/src/features/auth/components/VerifyForm.tsx`

Client component for the OTP input UI. Handles:
- Auto-focus next input on digit entry.
- Auto-submit when 6th digit entered.
- Error display ("Code expired", "Invalid code").
- Resend cooldown timer.

#### [MODIFY] [useAuth.ts](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/hooks/useAuth.ts)

- Re-export new `verify` and `resendCode` functions from AuthContext.

---

## File Change Summary

### Backend — 9 files (3 new, 6 modified)

| File | Action | Layer |
|---|---|---|
| [user_model.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/models/user_model.py) | MODIFY | DB Model |
| [user_schema.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/schemas/user_schema.py) | MODIFY | Schemas |
| [security.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/security.py) | MODIFY | Core |
| [config.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/config.py) | MODIFY | Core |
| [dependencies.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/core/dependencies.py) | MODIFY | Core |
| [auth_srv.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/services/auth_srv.py) | MODIFY | Services |
| `email_srv.py` | **NEW** | Services |
| [auth.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/api/v1/endpoints/auth.py) | MODIFY | Endpoints |
| [main.py](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/app/main.py) | MODIFY | App Config |
| [requirements.txt](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/backend/requirements.txt) | MODIFY | Dependencies |

### Frontend — 7 files (2 new, 5 modified)

| File | Action |
|---|---|
| [auth.types.ts](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/types/auth.types.ts) | MODIFY |
| [auth.api.ts](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/api/auth.api.ts) | MODIFY |
| [AuthContext.tsx](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/contexts/AuthContext.tsx) | MODIFY |
| [ProtectedRoute.tsx](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/components/ProtectedRoute.tsx) | MODIFY |
| [useAuth.ts](file:///c:/Users/pietr/OneDrive/Desktop/driving_school/frontend/src/hooks/useAuth.ts) | MODIFY |
| `app/verify-pending/page.tsx` | **NEW** |
| `features/auth/components/VerifyForm.tsx` | **NEW** |

---

## Verification Plan

### Automated Tests
```bash
# Backend: run existing test suite after changes
cd backend && python -m pytest app/tests/ -v

# Alembic migration check (after init)
cd backend && alembic upgrade head && alembic downgrade -1 && alembic upgrade head
```

### Manual Verification
1. **Signup flow:** POST `/signup` → check email received → POST `/verify` with correct code → user.is_verified flips to True.
2. **Expired code:** Wait 11 minutes → POST `/verify` → expect 400 "Code expired".
3. **Rate limit:** Send 6 requests to `/login` within 1 minute → 6th returns 429.
4. **Cookie flow:** POST `/login` → inspect `Set-Cookie` header → GET `/users/me` without `Authorization` header (cookie only) → should return user profile.
5. **CORS:** Call API from unknown origin → expect CORS block.
6. **Frontend:** Signup → land on `/verify-pending` → enter code → redirect to `/dashboard`. Refresh page → session persists (cookie survives F5).
