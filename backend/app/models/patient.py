import uuid
from sqlalchemy import (
    Boolean, Column, String, Integer, DateTime, Date, Enum, ForeignKey, Index, Uuid, func
)
from sqlalchemy.orm import relationship

from ..core.database import Base
from ..schemas.intake import GenderEnum


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    lab_id = Column(Uuid(as_uuid=True), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False, index=True)

    # The human-readable Unique Health ID (e.g., UHID-9876543210)
    display_uhid = Column(String(50), nullable=False)

    # ---------------------------------------------------------
    # DEMOGRAPHICS
    # ---------------------------------------------------------
    name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False, index=True) # Indexed for fast history lookup
    email = Column(String(150), nullable=True) 
    gender = Column(Enum(GenderEnum), nullable=False)
    dob = Column(Date, nullable=False)
    approximate_age = Column(Integer, nullable=True)
    blood_group = Column(String(10), nullable=True)
    address = Column(String(500), nullable=True)

    # ---------------------------------------------------------
    # DEDUPLICATION & COMPLIANCE (EMPI)
    # ---------------------------------------------------------
    is_active = Column(Boolean, default=True, nullable=False)

    # If this record was merged, this points to the surviving Master Record
    merged_into_id = Column(Uuid(as_uuid=True), ForeignKey("patients.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # ---------------------------------------------------------
    # CONSTRAINTS & INDEXES
    # ---------------------------------------------------------
    __table_args__ = (
        Index("ix_patient_lab_phone", "lab_id", "phone"),
        Index("ix_patient_lab_display_id", "lab_id", "display_uhid", unique=True),
    )

    # Self-referential relationship for merges
    merged_into = relationship("Patient", remote_side=[id])
    # Link to their visits
    intakes = relationship("Intake", back_populates="patient")