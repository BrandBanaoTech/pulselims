from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, UUID4, model_validator, field_validator

# ==========================================
# 1. ENUMS
# ==========================================
class GenderEnum(str, Enum):
    MALE = "M"
    FEMALE = "F"
    OTHER = "Other"

class PriorityEnum(str, Enum):
    ROUTINE = "Routine"
    URGENT = "Urgent"
    STAT = "STAT"

class DiscountTypeEnum(str, Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"
    NONE = "none"

class PaymentMethodEnum(str, Enum):
    CASH = "Cash"
    UPI = "UPI"
    CARD = "Card"
    BANK_TRANSFER = "Net_Banking"
    INSURANCE = "Insurance"
    NONE = "none"

class PaymentStatusEnum(str, Enum):
    UNPAID = "Unpaid"
    PARTIAL = "Partial"
    PAID = "Paid"
    REFUNDED = "Refunded"

class IntakeStatusEnum(str, Enum):
    REGISTERED = "registered"
    SAMPLE_COLLECTED = "sample_collected"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ==========================================
# 2. NESTED FRONTEND PAYLOADS
# ==========================================
class PatientPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    age: int = Field(..., ge=0, le=120)
    gender: GenderEnum
    phone: str = Field(..., min_length=10, max_length=15, pattern=r"^\+?[0-9\-\s]+$")
    address: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(str_strip_whitespace=True)


class ClinicalPayload(BaseModel):
    priority: PriorityEnum = Field(default=PriorityEnum.ROUTINE)
    doctor_reference: Optional[str] = Field(None, alias="doctor_refrence", max_length=150)
    clinical_notes: Optional[str] = Field(None, max_length=1000)
    test_ids: List[UUID4] = Field(..., min_length=1)

    @field_validator('test_ids')
    def validate_unique_tests(cls, v):
        if len(v) != len(set(v)): raise ValueError("Duplicate tests are not allowed.")
        return v
        
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)


class BillingPayload(BaseModel):
    payment_status: PaymentStatusEnum
    payment_method: PaymentMethodEnum
    discount_type: DiscountTypeEnum = Field(default=DiscountTypeEnum.NONE)
    discount_value: Decimal = Field(default=Decimal('0.00'), ge=0, max_digits=10, decimal_places=2)
    paid_amount: Optional[Decimal] = Field(default=Decimal('0.00'), ge=0, max_digits=10, decimal_places=2)

    @model_validator(mode='after')
    def validate_billing_logic(self) -> 'BillingPayload':
        if self.discount_type == DiscountTypeEnum.PERCENTAGE and self.discount_value > 100:
            raise ValueError("Percentage discounts cannot exceed 100%.")
        if self.discount_type == DiscountTypeEnum.NONE and self.discount_value > 0:
            raise ValueError("Discount value must be 0 if discount type is NONE.")
        if self.payment_status in [PaymentStatusEnum.PAID, PaymentStatusEnum.PARTIAL] and self.payment_method == PaymentMethodEnum.NONE:
            raise ValueError("Valid payment method required if status is PAID or PARTIAL.")
        return self


# ==========================================
# 3. ROOT SCHEMAS
# ==========================================
class IntakeCreate(BaseModel):
    """Payload received from the frontend."""
    patient: PatientPayload
    clinical: ClinicalPayload
    billing: BillingPayload


class IntakeUpdate(BaseModel):
    """Payload for updating status, collecting balance, or amending notes."""
    status: Optional[IntakeStatusEnum] = None
    sample_collection_date: Optional[datetime] = None
    clinical_notes: Optional[str] = Field(None, max_length=1000)
    
    additional_payment: Optional[Decimal] = Field(None, ge=0, max_digits=10, decimal_places=2)
    payment_method: Optional[PaymentMethodEnum] = None
    test_ids: Optional[List[UUID4]] = Field(None, min_length=1)

    model_config = ConfigDict(str_strip_whitespace=True)


class IntakeResponse(BaseModel):
    """Full flat data returned to the frontend."""
    id: UUID4
    lab_id: UUID4
    accession_number: str
    
    # Patient Data (Embedded)
    patient_name: str
    patient_phone: str
    patient_age: int
    patient_gender: GenderEnum
    patient_address: Optional[str] = None
    
    # Clinical Data
    priority: PriorityEnum
    referring_doctor: Optional[str] = None
    clinical_notes: Optional[str] = None
    test_ids: List[UUID4]
    
    # Workflow
    status: IntakeStatusEnum
    intake_date: datetime
    sample_collection_date: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Financials
    payment_status: PaymentStatusEnum
    payment_method: PaymentMethodEnum
    discount_type: DiscountTypeEnum
    discount_value: Decimal
    gross_amount: Decimal
    discount_amount: Decimal
    net_amount: Decimal
    paid_amount: Decimal
    balance_due: Decimal 

    model_config = ConfigDict(from_attributes=True)