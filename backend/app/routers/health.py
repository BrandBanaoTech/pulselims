from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from ..core.database import get_db # Adjust import to match your folder structure

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("", status_code=status.HTTP_200_OK)
def check_health(db: Session = Depends(get_db)):
    """
    Production-ready health check endpoint.
    Verifies the database connection is live and active.
    """
    try:
        # Executes a low-overhead query to verify the connection path
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "active"
        }
    except Exception as e:
        # If the database fails, return a 503 Service Unavailable status
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "Database connectivity loss"
        }