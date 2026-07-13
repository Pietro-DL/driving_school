from fastapi import APIRouter, Depends
from app.schemas.user_schema import UserResponse
from app.models.user_model import User
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Protected route. Returns the profile of the currently logged-in user.
    If the JWT is missing, expired, or invalid, this will return a 401.
    """
    return current_user