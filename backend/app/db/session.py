# backend/app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

# Create the async engine
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True)

# Create a session factory
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# Dependency to inject into FastAPI endpoints
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session