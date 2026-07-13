# backend/app/services/auth_srv.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user_model import User
from app.core.security import verify_password, get_password_hash
from app.schemas.user_schema import UserCreate


async def create_user(session: AsyncSession, user_in: UserCreate) -> User | None:
    """
    Handles the business logic of creating a new user.
    Returns None if the email is already taken.
    """
    # 1. Check if user already exists
    query = select(User).where(User.email == user_in.email)
    result = await session.execute(query)
    if result.scalars().first():
        return None  # Email already exists
    
    # 2. Hash password and build the model instance
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role="student",
        plan_tier="free"
    )
    
    # 3. Save to database
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    
    return new_user

async def authenticate_user(session: AsyncSession, email: str, password: str) -> User | None:
    """
    Takes an email and password, checks the database, and verifies the hash.
    Returns the User object if successful, None if it fails.
    """
    # 1. Query the database for the user by email
    query = select(User).where(User.email == email)
    result = await session.execute(query)
    user = result.scalars().first()
    
    # 2. If user doesn't exist, authentication fails
    if not user:
        return None
        
    # 3. Verify the provided password against the stored hash
    if not verify_password(password, user.hashed_password):
        return None
        
    # 4. Success!
    return user