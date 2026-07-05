from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base


try:
    Base.metadata.create_all(bind=engine)
    print("Persistent Database tables successfully verified or created!")
except Exception as e:
    print(f"Warning: Database table synchronization skipped or failed: {e}")
    print("Ensure DATABASE_URL is valid in configuration settings.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url=settings.DOCS_URL,
    redoc_url=settings.REDOC_URL,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# app.include_router(auth.router, prefix=f"{settings.API_V1_STR}", tags=["Authentication"])

@app.get("/")
def read_root():
    return {"message": "LIMS API Engine is running smoothly."}