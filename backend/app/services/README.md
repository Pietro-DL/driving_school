# backend\app\services\README.md

This directory stores all business logic. Functions here are reusable and agnostic to the HTTP transport layer. Endpoints delegate all work here.

## File Glossary & Breakdown

### `auth_srv.py`

Authentication and OTP verification service. All functions are async and accept an `AsyncSession`.

- **`create_user(session, user_in)`** → `tuple[User, str] | tuple[None, None]`
  Creates a new unverified user. Checks for duplicate email. Hashes password (bcrypt). Generates a CSPRNG 6-digit OTP, hashes it, sets 10-minute expiry. Returns `(User, raw_code)` on success — raw_code is emailed, never persisted. Returns `(None, None)` if email exists.

- **`verify_user_code(session, email, code)`** → `User`
  Validates the submitted OTP. Enforces: code expiry (10 min), brute-force lockout (5 attempts → code invalidated), bcrypt comparison. On success: sets `is_verified=True`, clears code fields, resets counter. Raises `HTTPException` on any failure.

- **`regenerate_code(session, email)`** → `tuple[User, str]`
  Generates a fresh OTP for an unverified user. Overwrites previous code. Resets `failed_verify_attempts`. Raises if user not found or already verified.

- **`authenticate_user(session, email, password)`** → `User | None`
  Verifies email + password. Returns `User` on success, `None` on failure. Deliberately does NOT check `is_verified`. The `/login` endpoint issues the HttpOnly cookie to any user with valid credentials so the frontend can call `GET /users/me`, read `is_verified=false`, and redirect to `/verify-pending`. Business endpoints enforce the verification gate via `get_current_verified_user`.

### `email_srv.py`

Async email service using `aiosmtplib`. Compatible with Gmail SMTP, SendGrid relay, and Resend relay.

- **`send_verification_email(to_email, code)`** → `None`
  Sends the 6-digit OTP email with an HTML template. Called as a `BackgroundTask` from signup and resend-code endpoints (response is instant). If `SMTP_HOST` is empty (local dev), logs the OTP to console instead. Failures are caught, logged, and re-raised for FastAPI BackgroundTask traceback logging.

- **`_build_verification_email(to_email, code)`** → `MIMEMultipart`
  Internal helper. Constructs the HTML MIME message with Italian-language template, OTP code box, and 10-minute expiry notice.