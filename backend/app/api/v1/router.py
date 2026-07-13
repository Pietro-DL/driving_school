from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()

# Attach the authentication endpoints under the /auth prefix
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])