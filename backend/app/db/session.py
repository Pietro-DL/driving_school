# backend/app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

# Create the async engine
# echo is controlled by DB_ECHO env var. MUST be False in production
# to avoid logging PII (email in WHERE clauses) and performance cost.
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=settings.DB_ECHO)

# Create a session factory
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# Dependency to inject into FastAPI endpoints
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session