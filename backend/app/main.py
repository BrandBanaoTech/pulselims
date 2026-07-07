import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.routers import auth, lab, membership
from .core.config import settings


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url=settings.DOCS_URL if settings.DEBUG else None,
    redoc_url=settings.REDOC_URL if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ==========================================
# 2. GLOBAL EXCEPTION HANDLER
# ==========================================
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Prevents raw database errors from being sent to the client.
    Logs the error internally for the developer.
    """
    print(f"Database Error: {exc}") # Replace with proper logging (e.g., structlog)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal database error occurred. Please contact support."},
    )


# ==========================================
# 3. REGISTER ROUTERS
# ==========================================
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}", tags=["Authentication"])
app.include_router(lab.router, prefix=f"{settings.API_V1_STR}", tags=["Laboratories"])
app.include_router(membership.router, prefix=f"{settings.API_V1_STR}", tags=["Staff Management"])


# ==========================================
# 4. HEALTH CHECK (For Load Balancers/Cloud)
# ==========================================
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "healthy", "service": "lab-management-api"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)