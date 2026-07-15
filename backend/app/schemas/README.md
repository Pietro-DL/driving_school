# backend\app\schemas\README.md

This directory stores all Pydantic schemas (Data Transfer Objects). Strictly separated into input schemas (request payloads) and output schemas (API responses).

## File Glossary & Breakdown

### `user_schema.py`

**Shared base:**
- `UserBase` — Base fields: `email` (EmailStr), `first_name`, `last_name`.

**Request schemas:**
- `UserCreate(UserBase)` — Payload for `POST /auth/signup`. Adds `password` field with constraints: 8-128 chars, at least one uppercase letter, at least one digit. Validated via `field_validator`.
- `VerifyCodeRequest` — Payload for `POST /auth/verify`. Fields: `email` (EmailStr), `code` (str — the raw 6-digit OTP).
- `ResendCodeRequest` — Payload for `POST /auth/resend-code`. Field: `email` (EmailStr).

**Response schemas:**
- `UserResponse(UserBase)` — Full user profile. Adds: `id` (UUID), `role`, `plan_tier`, `is_active`, `is_verified`, `created_at`. Uses `from_attributes=True` for ORM compatibility.
- `MessageResponse` — Generic `{ "message": str }` for endpoints that don't return user data (login, verify, resend-code, logout).

**Internal / JWT:**
- `Token` — `{ access_token, token_type }`. Kept for internal use and potential Swagger Bearer fallback.
- `TokenPayload` — JWT decode target. Fields: `sub` (str), `role` (str), `plan` (str). All optional with None default.