# backend/app/db/base_class.py
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """
    All SQLAlchemy models (like your user_model.py) will inherit from this Base.
    """
    pass