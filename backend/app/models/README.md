# backend\app\models\README.md:
In this directory we store all the SQLAlchemy code that represents the database tables and models.
We use the file "backend\app\models\README.md" to compact all the models.


## File Glossary & Breakdown
- `backend\app\models\user_model.py`

  The user model is a SQLAlchemy model that represents the users table in the database.
  It has the following fields:

  - id: A unique identifier for the user (UUID)
  - email: The email address of the user (String, unique, index)
  - hashed_password: The hashed password of the user (String)
  - first_name: The first name of the user (String)
  - last_name: The last name of the user (String)
  - role: The role of the user (String, default: 'student')
  - plan_tier: The plan tier of the user (String, default: 'free')
  - is_active: Whether the user is active (Boolean, default: True)
  - created_at: The creation date of the user (DateTime, server_default: current timestamp)




