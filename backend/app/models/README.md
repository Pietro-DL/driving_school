# backend\app\models\README.md

This directory stores all SQLAlchemy models representing database tables. Each model inherits from `Base` (defined in `db/base_class.py`).

## File Glossary & Breakdown

### `user_model.py`

The `User` model maps to the `users` table in PostgreSQL. Columns:

**Base user metadata:**
- `id` — UUID, primary key, auto-generated via `uuid.uuid4()`, indexed.
- `email` — String, unique, indexed, not nullable.
- `hashed_password` — String, not nullable. Stores bcrypt hash.
- `first_name` — String, not nullable.
- `last_name` — String, not nullable.
- `role` — String, default `"student"`, not nullable.
- `plan_tier` — String, default `"free"`, not nullable.
- `is_active` — Boolean, default `True`.
- `created_at` — DateTime (timezone-aware), server_default `now()`.

**OTP Verification:**
- `is_verified` — Boolean, default `False`, not nullable. Flips to `True` after successful OTP verification.
- `verification_code` — String, nullable. Stores the **bcrypt-hashed** 6-digit OTP (never plaintext).
- `code_expires_at` — DateTime (timezone-aware), nullable. 10-minute TTL set by the service layer.
- `failed_verify_attempts` — Integer, default `0`, not nullable. Brute-force counter. Code invalidated at 5 attempts.

**Migration:** Initial table created by Alembic revision `c1997413f93b` (`create_initial_users_table`).
