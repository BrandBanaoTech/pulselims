import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, JSON, Uuid
# from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    license_number = Column(String(100), nullable=True)
    support_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    timezone = Column(String(50), nullable=False, default="Asia/Kolkata")
    address = Column(JSON, nullable=False)
    
    # --- BRANDING & REPORT GENERATION FIELDS ---
    logo_url = Column(String(1024), nullable=True)
    website = Column(String(255), nullable=True)
    report_header_text = Column(String(500), nullable=True)
    report_footer_text = Column(Text, nullable=True)
    
    # --- LEGAL COMPLIANCE FIELDS ---
    director_name = Column(String(150), nullable=True)
    director_signature_url = Column(String(1024), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    # 🔒 THE HARD LOCK: unique=True guarantees at the database level that 1 User = 1 Lab
    owner_id = Column(
        Uuid(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT"), 
        unique=True, 
        nullable=False,
        index=True
    )
    # owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    # Audit Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # ==========================================
    # RELATIONSHIPS
    # ==========================================
    # Because we separated the files, SQLAlchemy uses the string "LabMembership" 
    # to find the model without needing to import it at the top, preventing circular imports!
    owner = relationship("User", back_populates="owned_labs")
    staff = relationship("LabMembership", back_populates="lab", cascade="all, delete-orphan")