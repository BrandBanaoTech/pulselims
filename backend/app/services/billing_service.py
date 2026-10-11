import uuid
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.lab import LabTest
from ..schemas.intake import PaymentStatusEnum, DiscountTypeEnum

def calculate_payment_status(net_amount: Decimal, paid_amount: Decimal) -> PaymentStatusEnum:
    """Calculates payment status based on net totals and amount paid."""
    if paid_amount >= net_amount and net_amount > Decimal('0.00'):
        return PaymentStatusEnum.PAID
    elif paid_amount > Decimal('0.00'):
        return PaymentStatusEnum.PARTIAL
    return PaymentStatusEnum.UNPAID

def compute_invoice_totals(
    db: Session,
    lab_id: uuid.UUID,
    test_ids: List[uuid.UUID],
    discount_type: DiscountTypeEnum,
    discount_value: Decimal,
    paid_amount: Optional[Decimal] = Decimal('0.00')
) -> Dict[str, Any]:
    """
    Zero-Trust Financial Pricing Engine.
    Fetches exact test prices from the database, calculates secure discounts, 
    evaluates balance dues, and returns immutable ledger totals.
    """
    if not test_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="An invoice must contain at least one diagnostic test."
        )

    # 1. ZERO-TRUST PRICING: Fetch exact active prices from the DB
    # Prevents frontend price tampering or injection attacks
    tests = db.execute(
        select(LabTest).where(
            LabTest.id.in_(test_ids),
            LabTest.lab_id == lab_id, 
            LabTest.is_active == True
        )
    ).scalars().all()

    if len(tests) != len(test_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="One or more selected tests are invalid, inactive, or belong to another lab."
        )

    # Sum up gross total using precise Decimal arithmetic
    gross_amount = sum((t.price or Decimal('0.00') for t in tests), Decimal('0.00'))

    # 2. Calculate Secure Discounts
    disc_val = discount_value or Decimal('0.00')
    discount_amount = Decimal('0.00')

    if discount_type == DiscountTypeEnum.PERCENTAGE:
        if disc_val < Decimal('0.00') or disc_val > Decimal('100.00'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Percentage discount must be between 0 and 100."
            )
        discount_amount = (disc_val / Decimal('100.00')) * gross_amount
    elif discount_type == DiscountTypeEnum.FLAT:
        discount_amount = disc_val

    if discount_amount > gross_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Discount amount cannot exceed the gross amount."
        )

    # 3. Final Calculations & Validations
    net_amount = gross_amount - discount_amount
    paid = paid_amount or Decimal('0.00')

    if paid > net_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Paid amount cannot exceed the net billable amount."
        )

    balance_due = net_amount - paid
    payment_status = calculate_payment_status(net_amount, paid)

    # Return structured dictionary ready for Invoice creation or updating
    return {
        "gross_amount": gross_amount.quantize(Decimal('0.01')),
        "discount_amount": discount_amount.quantize(Decimal('0.01')),
        "net_amount": net_amount.quantize(Decimal('0.01')),
        "paid_amount": paid.quantize(Decimal('0.01')),
        "balance_due": balance_due.quantize(Decimal('0.01')),
        "payment_status": payment_status
    }