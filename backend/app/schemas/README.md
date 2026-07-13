# backend\app\schemas\README.md:
In this directory we store all the pydantic schemas. We need strictly separated schemas for the input (to the API) and the output (from the API).
We use the file "backend\app\schemas\README.md" to compact all the schemas.
# Glossary of Files:
- `backend\app\schemas\user_schema.py`
  The user schema is a Pydantic model that represents the user model.
   It has the following classes:
  - **UserBase:** Base class for user model
  - **UserCreate:** Schema for creating a new user
  - **UserResponse:** Schema for returning a user
  - **Token:** Schema for returning a token
  - **TokenPayload:** Schema for returning a token payload