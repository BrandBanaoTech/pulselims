from schemas.intake import DiscountTypeEnum, PaymentMethodEnum, PaymentStatusEnum

from ..core.database import Base

from sqlalchemy import (
    Column, String, Enum, Numeric, Uuid, ForeignKey
)


class payments(Base):
    __tablename__ = "payments"

    lab_id = Column(Uuid(as_uuid=True), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False, index=True)

    # ---------------------------------------------------------
    # FINANCIALS & MULTI-CURRENCY
    # ---------------------------------------------------------
    currency = Column(String(3), nullable=False, default="INR") # ISO 4217 Currency Code
    
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.UNPAID, nullable=False)
    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.NONE, nullable=False)
    
    discount_type = Column(Enum(DiscountTypeEnum), default=DiscountTypeEnum.NONE, nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False, default=0.00) 
    
    gross_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    net_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    paid_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    balance_due = Column(Numeric(10, 2), nullable=False, default=0.00)