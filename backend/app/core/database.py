import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool # Import this for Supabase!
from typing import Generator

# Securely load the URL from the environment (set in Render Dashboard)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# Automatically fix legacy "postgres://" schemes injected by some cloud providers
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure the Engine based on the database type
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # Local Development Configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Production Cloud Configuration (Supabase Transaction Pooler - Port 6543)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=NullPool, # Let Supabase handle the pooling to prevent memory leaks
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db() -> Generator:
    """FastAPI Dependency to acquire a clean SQLAlchemy session and auto-close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()