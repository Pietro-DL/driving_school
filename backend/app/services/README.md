# backend\app\services\README.md
In this file, we compact all the content of the folder "backend\app\services\" where we store all the business logic of the app.

## File Glossary & Breakdown
- `backend\app\services\auth_srv.py`
    In this file, we define the authentication service.
    - **authenticate_user(session, email, password):**
    This asynchronous function takes an email and password, checks the database, and verifies the hash.
    Returns the User object if successful, None if it fails.
    Deliberately does NOT check `is_verified`. The `/login` endpoint issues the HttpOnly cookie to
    any user with valid credentials so the frontend can call `GET /users/me`, read `is_verified=false`,
    and redirect to `/verify-pending`. Business endpoints enforce the verification gate via
    `get_current_verified_user`.
    - **create_user(session, user_in):**
    This asynchronous function creates a new user.
    Returns the new User object