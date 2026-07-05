import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Uuid
# from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True) # Cryptographically secure UUIDs prevent URL guessing (IDOR)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(20), unique=True, index=True, nullable=False) # Stored in E.164 format via Pydantic validation before saving
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_platform_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    # owned_labs = relationship("Lab", back_populates="owner", cascade="all, delete-orphan")
    # memberships = relationship("LabMembership", back_populates="user", cascade="all, delete-orphan")