from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.db.base_class import Base
# Import the model to make sure it registers on the metadata object
from app.models.user_model import User

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"/openapi.json"
)

# Enable CORS so Stefano's frontend agent won't face network blocks later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust to specific domains for final production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """On app execution, create the database tables automatically if they don't exist."""
    async with engine.begin() as conn:
        # Tables are constructed asynchronously
        await conn.run_sync(Base.metadata.create_all)

# Mount our route tree
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root_check():
    return {"status": "healthy", "message": "Driving School API operational"}