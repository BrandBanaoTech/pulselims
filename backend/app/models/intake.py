import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Enum, ForeignKey, 
    Index, JSON, Numeric, Integer, UniqueConstraint, select, func, event, Uuid
)
from sqlalchemy.orm import relationship

from ..core.database import Base 
from ..schemas.intake import (
    IntakeStatusEnum, PaymentStatusEnum, PaymentMethodEnum, 
    PriorityEnum, DiscountTypeEnum, GenderEnum
)

class Intake(Base):
    __tablename__ = "intakes"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    lab_id = Column(Uuid(as_uuid=True), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Auto-Generated identifiers
    lab_sequence = Column(Integer, nullable=False)
    accession_number = Column(String(30), nullable=False, index=True) # e.g., ACC-1001
    
    # ---------------------------------------------------------
    # EMBEDDED PATIENT DATA
    # ---------------------------------------------------------
    patient_name = Column(String(150), nullable=False)
    patient_phone = Column(String(20), nullable=False, index=True) # Indexed for fast history lookup
    patient_age = Column(Integer, nullable=False)
    patient_gender = Column(Enum(GenderEnum), nullable=False)
    patient_address = Column(String(500), nullable=True)
    
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # ---------------------------------------------------------
    # CLINICAL DATA
    # ---------------------------------------------------------
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.ROUTINE, nullable=False)
    referring_doctor = Column(String(150), nullable=True, index=True)
    clinical_notes = Column(String(1000), nullable=True)
    
    intake_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    sample_collection_date = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(Enum(IntakeStatusEnum), default=IntakeStatusEnum.REGISTERED, nullable=False, index=True)
    
    # ---------------------------------------------------------
    # FINANCIALS 
    # ---------------------------------------------------------
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.UNPAID, nullable=False)
    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.NONE, nullable=False)
    
    discount_type = Column(Enum(DiscountTypeEnum), default=DiscountTypeEnum.NONE, nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False, default=0.00) 
    
    gross_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    net_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    paid_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    balance_due = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    test_ids = Column(JSON().with_variant(JSON, 'postgresql'), nullable=False, default=list)

    # ---------------------------------------------------------
    # CONSTRAINTS & INDEXES
    # ---------------------------------------------------------
    __table_args__ = (
        UniqueConstraint("lab_id", "accession_number", name="uq_lab_accession"),
        Index("ix_lab_patient_phone", "lab_id", "patient_phone"), # Quickly find returning patients
        Index("ix_lab_intake_date", "lab_id", "intake_date"),
    )

    lab = relationship("Lab", backref="intakes")
    creator = relationship("User", backref="created_intakes")


@event.listens_for(Intake, 'before_insert')
def set_accession_number(mapper, connection, target):
    """Calculates the next safe sequence number strictly for this specific lab."""
    table = Intake.__table__
    stmt = select(func.max(table.c.lab_sequence)).where(table.c.lab_id == target.lab_id)
    max_seq = connection.execute(stmt).scalar()
    
    next_seq = (max_seq or 999) + 1
    target.lab_sequence = next_seq
    if not target.accession_number:
        target.accession_number = f"ACC-{next_seq}"