# backend\app\api\README.md

In this directory, we store the routing layer (Controllers / Endpoints) of the FastAPI application.

The primary responsibility of this layer is to define the API routes, parse incoming parameters (path, query, body), validate them using Pydantic schemas, and delegate the actual work to the `services` layer.

**Golden Rule:** Code in this directory must be extremely thin. Endpoints must NEVER contain business logic, complex data transformations, or direct database queries. They act strictly as traffic cops.

## File Glossary & Breakdown

- **`backend\app\api\v1\router.py`**
  This is the main API router for version 1 of the API. It imports the individual feature routers from the `endpoints/` directory and mounts them (e.g., attaching the `auth.py` router under the `/auth` prefix, the `users.py` router under `/users`). This file is then imported by `main.py` to register all API routes.

### `v1/endpoints/`

This subdirectory contains the actual endpoint definitions, logically grouped by domain features.

- **`auth.py`**
  Contains endpoints for user authentication, registration, email verification, and logout.
  - `POST /signup` — Creates a new unverified user with a hashed OTP. Fires the verification email as a `BackgroundTask`. Returns 201 with `UserResponse` (is_verified=false). Rate-limited: 3/minute.
  - `POST /login` — Authenticates user via `OAuth2PasswordRequestForm` (email + password). Sets a signed JWT in an **HttpOnly cookie** (not in the response body). Returns `MessageResponse`. Rate-limited: 5/minute.
  - `POST /verify` — Validates the 6-digit OTP code against the stored bcrypt hash. Enforces brute-force lockout (5 attempts) and 10-minute expiry. Returns `MessageResponse`. Rate-limited: 5/minute.
  - `POST /resend-code` — Regenerates a fresh OTP for an unverified user. Sends new email as `BackgroundTask`. Resets attempt counter. Returns `MessageResponse`. Rate-limited: 1/minute.
  - `POST /logout` — Clears the HttpOnly auth cookie server-side. Requires authentication (get_current_user dependency). Returns `MessageResponse`.

- **`users.py`**
  This file contains the endpoints for user management.
  - `GET /me` — Returns the profile of the currently logged-in user (`UserResponse`). Uses `get_current_user` (not `get_current_verified_user`) so the frontend can read `is_verified` and redirect accordingly.