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
    Register a brand new user.
    """
    # Pass the data directly to the service layer
    new_user = await auth_srv.create_user(session=db, user_in=user_in)
    
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in the system."
        )
        
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