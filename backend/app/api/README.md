# backend\app\api\README.md

In this directory, we store the routing layer (Controllers / Endpoints) of the FastAPI application.

The primary responsibility of this layer is to define the API routes, parse incoming parameters (path, query, body), validate them using Pydantic schemas, and delegate the actual work to the `services` layer.

**Golden Rule:** Code in this directory must be extremely thin. Endpoints must NEVER contain business logic, complex data transformations, or direct database queries. They act strictly as traffic cops.

## File Glossary & Breakdown

- **`backend\app\api\v1\router.py`**
  This is the main API router for version 1 of the API. It imports the individual feature routers from the `endpoints/` directory and mounts them (e.g., attaching the `auth.py` router under the `/auth` prefix). This file is then imported by `main.py` to register all API routes.

### `v1/endpoints/`

This subdirectory contains the actual endpoint definitions, logically grouped by domain features.

- **`auth.py`**
  Contains endpoints for user authentication and registration. 
  - `POST /signup`: Receives user details, ensures the email isn't duplicated, hashes the password, and creates a new user.
  - `POST /login`: Receives form-data (username and password), authenticates the user via the auth service, and returns a signed JWT access token.

- **`users.py`**
  This file contains the endpoints for user management.
  - `GET /me`: Returns the profile of the currently logged-in user.