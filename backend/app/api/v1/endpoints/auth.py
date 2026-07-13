# backend/app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user_model import User
from app.schemas.user_schema import UserCreate, UserResponse, Token
from app.core import security
from app.services import auth_srv

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a brand new user. Checks for email duplication, hashes 
    the password, and stores the user record in PostgreSQL.
    """
    # Check if user already exists
    query = select(User).where(User.email == user_in.email)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in the system."
        )
    
    # Create new user instance using our security hashing utility
    hashed_password = security.get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role="student",  # Default role
        plan_tier="free" # Default plan tier
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Standard OAuth2 compatible token login.
    Expects form-data with fields: 'username' (which is the email) and 'password'.
    """
    user = await auth_srv.authenticate_user(
        session=db, 
        email=form_data.username, 
        password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user account has been deactivated."
        )
        
    # Generate the signed JWT token containing the user identity parameters
    access_token = security.create_access_token(
        subject=user.id, 
        role=user.role, 
        plan_tier=user.plan_tier
    )
    
    return {"access_token": access_token, "token_type": "bearer"}