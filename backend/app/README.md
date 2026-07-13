# backend\app\README.md
In this directory, we store the core application logic for the FastAPI backend. This project strictly follows a layered architectural pattern to separate concerns, ensure modularity, and maintain maximum security.
**Server build command squence:**
``` bash
cd backend
.venv/scripts/activate
uvicorn app.main:app --reload
```
 

We use this file (backend\app\README.md) to define the global rules of the backend architecture and to bridge the interactions between all subdirectories.

# Direct Glossary:
- **api/:** The routing layer (Endpoints).
- **core/:** Global configurations and security utilities.
- **db/:** Database connection and session management.
- **models/:** SQLAlchemy database models.
- **schemas/:** Pydantic validation models.
- **services/:** Business and application logic.
- **tests/:** Automated test suites.

# Architectural Data Flow & Rules
To prevent spaghetti code and to give clear instructions to automated agents, every incoming HTTP request MUST follow this exact flow:

1. **Routing (api/):** The request is received by a router in api/v1/endpoints/.
2. **Validation (schemas/):** The incoming payload is validated against a Pydantic schema from the schemas/ directory.

3. **Execution (services/):** The endpoint passes the validated data to a function in the services/ directory. Rule: Endpoints must NEVER contain business logic or direct database queries.

4. **Data Access (models/ & db/):** The service layer interacts with the database using SQLAlchemy models from models/ via the session provided by db/.

5. **Response:** The service returns data back to the endpoint, which serializes it using an outgoing Pydantic schema and returns the HTTP response.

# Detailed Directory Breakdown
(See backend\app\"directory_name"\README.md for specific definitions)

## api/ (Controllers / Routers)
This directory defines the API endpoints.
- **Purpose:** Map HTTP methods (GET, POST, etc.) to specific URLs. Parse path parameters, query parameters, and dependencies (like the current authenticated user).
- **Restriction:** Code here must be extremely thin. It only accepts requests, delegates work to services/, and returns standard HTTP responses or exceptions.

## core/ (Configuration & Security)
This directory handles app-wide constants and security protocols.
- **Purpose:** Stores the Pydantic BaseSettings for environment variables (loading .env), JWT token generation/verification logic, password hashing algorithms, and global dependency injections (like get_current_user).

## db/ (Database Setup)
This directory configures the connection to PostgreSQL.
- **Purpose:** Contains the SQLAlchemy engine setup, the asynchronous session maker (sessionmaker), and the Base class that all SQLAlchemy models inherit from. Alembic migration configurations also reference this module.

## models/ (Data Access Layer)
- **Purpose:** Defines the exact tables, columns, and relationships in the PostgreSQL database using SQLAlchemy. These files are the single source of truth for the database schema.

## schemas/ (Data Transfer Objects)
- **Purpose:** Defines the strict JSON structures for data entering the API (Input) and leaving the API (Output). These Pydantic models enforce type checking and strip out sensitive data (like passwords) before returning responses to the frontend.

## services/ (Business Logic Layer)
This is where the heavy lifting happens.
- **Purpose:** Contains the actual algorithms and procedures of the application. Authentication checks, payment webhook processing, database CRUD operations (Create, Read, Update, Delete), and external API calls all live here.
- **Rule:** Functions here should be highly reusable and agnostic to the HTTP transport layer.

# tests/ (Quality Assurance)
- **Purpose:** Contains pytest files for unit testing components in isolation and integration testing the API endpoints. Structure mirrors the app/ directory (e.g., tests/api/, tests/services/).