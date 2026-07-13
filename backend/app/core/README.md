# backend\app\core\README.md
In this file we are going to compact the content of the directory "backend\app\core".
This directory contains all the files that are used to configure the application and to secure the application.

## File Glossary & Breakdown
- `backend\app\core\config.py`
  This is a Python file that is used to configure the application. It is a singleton class that is used to store the configuration of the application.
- `backend\app\core\security.py`
  This is a Python file that is used to secure the application. 
  Inside this file we have the following methods:
  - verify_password: This method is used to verify the password.
  - get_password_hash: This method is used to hash the password.
  - create_access_token: This method is used to create the access token.
- `backend/app/core/dependencies.py`
  This file will contain a function named get_current_user. Every time you want an endpoint to be private (like a driving lesson or a user profile), you will inject this dependency.
  - **What it does:** It intercepts the incoming HTTP request, extracts the Authorization: Bearer <token> header, decodes it using your SECRET_KEY, and fetches the user from the database. If the token is fake or expired, it throws a 401 Unauthorized error.

