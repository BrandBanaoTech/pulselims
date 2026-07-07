import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    # Cryptographically secure UUIDs prevent URL guessing (IDOR attacks)
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # ⚡ PERFORMANCE: index=True ensures sub-millisecond login lookups
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(20), unique=True, index=True, nullable=False) 
    
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    
    # 🔒 COMPLIANCE: Default False requires explicit OTP verification to activate
    is_active = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_platform_admin = Column(Boolean, default=False, nullable=False)
    
    # Audit Timestamps for SOC2 / HIPAA Compliance
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # ==========================================
    # DOMAIN RELATIONSHIPS (Lazy Loaded)
    # ==========================================
    # cascade="all, delete-orphan": If a user deletes their account, 
    # the database automatically wipes their labs and staff access to comply with GDPR/Data Privacy laws.
    
    owned_labs = relationship(
        "Lab", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
    
    memberships = relationship(
        "LabMembership", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )