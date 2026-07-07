from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from typing import Generator
from .config import settings

# Securely load the URL
# SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Fix for common Cloud/Heroku/Render URI schemes
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure the Engine
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # Production Cloud Configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=NullPool,     # Critical for Supabase Transaction Pooler
        pool_pre_ping=True,     # Critical for Cloud SQL: Automatically handles stale connections
    )

# Session Setup
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# FastAPI Dependency
def get_db() -> Generator:
    """Acquires a session and ensures it closes even if an error occurs."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()