import uuid
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base

# ==========================================
# MEMBERSHIP STATUS ENUMERATION
# ==========================================
# We define it here again so SQLAlchemy can map it strictly to a Postgres ENUM type
class MembershipStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


# ==========================================
# LAB MEMBERSHIP MODEL (TENANT RBAC)
# ==========================================
class LabMembership(Base):
    __tablename__ = "lab_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign Keys with CASCADE: If a user or lab is deleted, clean up their memberships automatically
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lab_id = Column(UUID(as_uuid=True), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False)
    
    # ⚡ PostgreSQL JSONB: Optimized for fast querying of permission arrays
    permissions = Column(JSON, nullable=False, server_default='["read_only"]')
    
    # 🔒 Strict Database-Level State Machine
    status = Column(SQLEnum(MembershipStatus), nullable=False, default=MembershipStatus.PENDING)
    
    # 🛡️ 2-Step OTP Verification Fields (Encrypted/Hashed)
    otp_hash = Column(String(255), nullable=True, doc="Hashed OTP for verifying staff invitations.")
    otp_expires_at = Column(DateTime(timezone=True), nullable=True, doc="Expiration timestamp for the OTP.")

    # Audit Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships (Ensure these match the back_populates names in your User and Lab models)
    user = relationship("User", back_populates="memberships")
    lab = relationship("Lab", back_populates="staff")

    # ==========================================
    # PERFORMANCE & INTEGRITY CONSTRAINTS
    # ==========================================
    __table_args__ = (
        # 1. INTEGRITY: A user can only have ONE membership record per lab.
        UniqueConstraint("user_id", "lab_id", name="uix_user_lab"), 
        
        # 2. PERFORMANCE: Compound index for lightning-fast authorization checks during API calls.
        Index("ix_user_lab_lookup", "user_id", "lab_id"), 
    )