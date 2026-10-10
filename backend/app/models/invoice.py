import uuid
from sqlalchemy import (
    Column, String, Enum, ForeignKey, 
    Index, Numeric, UniqueConstraint, Uuid
)
from sqlalchemy.orm import relationship

from ..core.database import Base 
from ..schemas.intake import (
    PaymentStatusEnum, PaymentMethodEnum, DiscountTypeEnum
)
from .mixins import AuditMixin

class Invoice(Base, AuditMixin):
    __tablename__ = "invoices"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_id = Column(Uuid(as_uuid=True), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 1-to-1 Link to the Intake
    intake_id = Column(Uuid(as_uuid=True), ForeignKey("intakes.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    invoice_number = Column(String(30), nullable=False, index=True) # e.g., INV-260918-001

    # ---------------------------------------------------------
    # FINANCIALS 
    # ---------------------------------------------------------
    currency = Column(String(3), nullable=False, default="INR") 
    
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.UNPAID, nullable=False, index=True)
    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.NONE, nullable=False)
    
    discount_type = Column(Enum(DiscountTypeEnum), default=DiscountTypeEnum.NONE, nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False, default=0.00) 
    
    gross_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    net_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    paid_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    balance_due = Column(Numeric(10, 2), nullable=False, default=0.00)

    # ---------------------------------------------------------
    # CONSTRAINTS & INDEXES
    # ---------------------------------------------------------
    __table_args__ = (
        UniqueConstraint("lab_id", "invoice_number", name="uq_lab_invoice"),
        # High-performance index for "Show me all unpaid bills for this lab"
        Index("ix_invoice_lab_status", "lab_id", "payment_status"),
    )

    # ---------------------------------------------------------
    # RELATIONSHIPS
    # ---------------------------------------------------------
    lab = relationship("Lab")
    intake = relationship("Intake", back_populates="invoice")

    # Audit Tracking
    creator = relationship("User", foreign_keys="[Invoice.created_by_id]")
    updater = relationship("User", foreign_keys="[Invoice.updated_by_id]")