import uuid
import logging
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, exc
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..api.deps import require_lab_permission
from ..models.user import User
from ..models.intake import Intake
from ..models.lab import LabTest 
from ..schemas.auth import TokenPayload
from ..schemas.intake import (
    IntakeCreate, IntakeUpdate, IntakeResponse,
    PaymentStatusEnum, IntakeStatusEnum, DiscountTypeEnum
)

logger = logging.getLogger("security_audit")
router = APIRouter(prefix="/intakes")


def calculate_payment_status(net_amount: Decimal, paid_amount: Decimal) -> PaymentStatusEnum:
    if paid_amount >= net_amount and net_amount > 0: return PaymentStatusEnum.PAID
    elif paid_amount > 0: return PaymentStatusEnum.PARTIAL
    return PaymentStatusEnum.UNPAID


@router.post("", response_model=IntakeResponse, status_code=status.HTTP_201_CREATED)
def create_intake(
    payload: IntakeCreate,
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("manage_intakes"))
):
    user_uuid = uuid.UUID(token.sub)
    user_lab_id = db.execute(select(User.default_lab_id).where(User.id == user_uuid)).scalar()

    # 1. ZERO-TRUST PRICING: Fetch exact prices from the DB
    tests = db.execute(
        select(LabTest.price).where(
            LabTest.id.in_(payload.clinical.test_ids),
            LabTest.lab_id == user_lab_id, 
            LabTest.is_active == True
        )
    ).scalars().all()

    if len(tests) != len(payload.clinical.test_ids):
        raise HTTPException(status_code=400, detail="One or more tests are invalid or inactive.")

    gross_amount = sum((t or Decimal('0.00') for t in tests), Decimal('0.00'))
    
    # 2. Calculate Secure Discounts
    discount_amount = Decimal('0.00')
    if payload.billing.discount_type == DiscountTypeEnum.PERCENTAGE:
        discount_amount = (payload.billing.discount_value / Decimal('100.00')) * gross_amount
    elif payload.billing.discount_type == DiscountTypeEnum.FLAT:
        discount_amount = payload.billing.discount_value
        
    if discount_amount > gross_amount:
        raise HTTPException(status_code=400, detail="Discount cannot exceed gross amount.")

    net_amount = gross_amount - discount_amount
    paid_amount = payload.billing.paid_amount or Decimal('0.00')
    
    if paid_amount > net_amount:
        raise HTTPException(status_code=400, detail="Collected amount cannot exceed the net bill.")

    balance_due = net_amount - paid_amount
    payment_status = calculate_payment_status(net_amount, paid_amount)

    # 3. CONCURRENCY RETRY LOOP
    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        try:
            # Flatten the nested payload into the flat database model
            new_intake = Intake(
                lab_id=user_lab_id,
                created_by=user_uuid,
                
                # Patient Data
                patient_name=payload.patient.name,
                patient_phone=payload.patient.phone,
                patient_age=payload.patient.age,
                patient_gender=payload.patient.gender,
                patient_address=payload.patient.address,
                
                # Clinical Data
                priority=payload.clinical.priority,
                referring_doctor=payload.clinical.doctor_reference,
                clinical_notes=payload.clinical.clinical_notes,
                test_ids=[str(t_id) for t_id in payload.clinical.test_ids],
                
                # Financial Data
                payment_status=payment_status,
                payment_method=payload.billing.payment_method,
                discount_type=payload.billing.discount_type,
                discount_value=payload.billing.discount_value,
                gross_amount=gross_amount,
                discount_amount=discount_amount,
                net_amount=net_amount,
                paid_amount=paid_amount,
                balance_due=balance_due
            )
            
            db.add(new_intake)
            db.commit()      
            db.refresh(new_intake)
            return new_intake
            
        except exc.IntegrityError:
            db.rollback()
            if attempt == MAX_RETRIES - 1:
                raise HTTPException(status_code=409, detail="High server traffic. Please click save again.")


@router.get("", response_model=List[IntakeResponse])
def list_intakes(
    status: Optional[IntakeStatusEnum] = Query(None),
    phone: Optional[str] = Query(None, description="Search returning patient history"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("view_intakes"))
):
    user_uuid = uuid.UUID(token.sub)
    user_lab_id = db.execute(select(User.default_lab_id).where(User.id == user_uuid)).scalar()

    stmt = select(Intake).where(Intake.lab_id == user_lab_id)

    if status: stmt = stmt.where(Intake.status == status)
    if phone: stmt = stmt.where(Intake.patient_phone.ilike(f"%{phone}%"))

    stmt = stmt.order_by(Intake.intake_date.desc()).limit(limit).offset(offset)
    return db.execute(stmt).scalars().all()


@router.put("/{intake_id}", response_model=IntakeResponse)
def update_intake(
    intake_id: uuid.UUID,
    payload: IntakeUpdate,
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("manage_intakes"))
):
    user_uuid = uuid.UUID(token.sub)
    user_lab_id = db.execute(select(User.default_lab_id).where(User.id == user_uuid)).scalar()

    intake = db.execute(select(Intake).where(Intake.id == intake_id, Intake.lab_id == user_lab_id)).scalars().first()
    if not intake: raise HTTPException(status_code=404, detail="Order not found.")

    update_data = payload.model_dump(exclude_unset=True)

    if payload.additional_payment is not None and payload.additional_payment > 0:
        new_paid = intake.paid_amount + payload.additional_payment
        if new_paid > intake.net_amount:
            raise HTTPException(status_code=400, detail=f"Overpayment. Max remaining balance is ₹{intake.balance_due}")
            
        intake.paid_amount = new_paid
        intake.balance_due = intake.net_amount - new_paid
        intake.payment_status = calculate_payment_status(intake.net_amount, new_paid)
        del update_data['additional_payment'] 

    if "test_ids" in update_data and update_data["test_ids"] is not None:
        update_data["test_ids"] = [str(t_id) for t_id in update_data["test_ids"]]

    for key, value in update_data.items():
        setattr(intake, key, value)
        
    db.commit()
    db.refresh(intake)
    return intake


@router.delete("/{intake_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_intake(
    intake_id: uuid.UUID,
    db: Session = Depends(get_db),
    token: TokenPayload = Depends(require_lab_permission("manage_intakes"))
):
    user_uuid = uuid.UUID(token.sub)
    user_lab_id = db.execute(select(User.default_lab_id).where(User.id == user_uuid)).scalar()

    intake = db.execute(select(Intake).where(Intake.id == intake_id, Intake.lab_id == user_lab_id)).scalars().first()
    if not intake: raise HTTPException(status_code=404, detail="Order not found.")
    
    intake.status = IntakeStatusEnum.CANCELLED
    db.commit()
    return None