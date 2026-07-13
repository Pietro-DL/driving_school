# backend/app/services/auth_srv.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user_model import User
from app.core.security import verify_password

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