# backend\app\db\README.md
In this file, we compact the content of the directory "backend\app\db\", which is used to store the database connections, models, and sessions.

**Files Glossary:**
- backend\app\db\base_class.py
- backend\app\db\session.py

## backend\app\db\base_class.py:
In this file, we declare the base class for all SQLAlchemy models, so that the server isn't blocked while waiting for the database to respond.

## backend\app\db\session.py:
In this file, we create the database engine and session. By importing the config setting from 'backend\app\core\config.py', we can create a async engine and session that can be used to interact with the database.