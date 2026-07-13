# backend\app\services\README.md
In this file, we compact all the content of the folder "backend\app\services\" where we store all the business logic of the app.

# Glossary
- backend\app\services\auth_srv.py

# backend\app\services\auth_srv.py:
In this file, we define the authentication service.
- **authenticate_user(session, email, password):**
This asynchronous function takes an email and password, checks the database, and verifies the hash.
Returns the User object if successful, None if it fails.