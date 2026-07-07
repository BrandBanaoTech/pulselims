import uuid
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Adjust imports to match your project structure
from ..core.database import get_db
from ..api.deps import require_lab_permission
from ..schemas.auth import TokenPayload
from ..schemas.membership import (
    StaffAddInitiate, 
    StaffAddVerify, 
    StaffUpdate, 
    StaffResponse,
    MembershipStatus
)
from ..models.user import User
from ..models.lab import Lab
from ..models.labmembership import LabMembership

# Setup standard bcrypt for cryptographic OTP hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/labs/{lab_id}/staff")

# ==========================================
# 1. INITIATE STAFF ADDITION (SEND OTP)
# ==========================================
@router.post("/initiate", status_code=status.HTTP_200_OK)
def initiate_staff_addition(
    lab_id: uuid.UUID,
    staff_in: StaffAddInitiate,
    db: Session = Depends(get_db),
    # Layer 1: Only users with 'owner' permissions can invite staff
    token_payload: TokenPayload = Depends(require_lab_permission("owner"))
):
    """
    Step 1: Looks up the user, generates a secure OTP, hashes it, and saves a PENDING membership.
    """
    # Look up the target user by email or mobile
    stmt = select(User)
    if staff_in.email:
        stmt = stmt.where(User.email == staff_in.email)
    else:
        stmt = stmt.where(User.mobile_number == staff_in.mobile_number)
        
    target_user = db.execute(stmt).scalars().first()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. They must create an account before being added to a lab."
        )

    # Cryptographically secure 6-digit OTP generation
    raw_otp = str(secrets.randbelow(900000) + 100000)
    hashed_otp = pwd_context.hash(raw_otp)
    expiration = datetime.now(timezone.utc) + timedelta(minutes=15)

    # Check if a membership already exists
    existing_stmt = select(LabMembership).where(
        LabMembership.user_id == target_user.id,
        LabMembership.lab_id == lab_id
    )
    membership = db.execute(existing_stmt).scalars().first()

    if membership:
        if membership.status == MembershipStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user is already an active staff member of this laboratory."
            )
        # If PENDING or SUSPENDED, update the OTP and expiration
        membership.otp_hash = hashed_otp
        membership.otp_expires_at = expiration
        membership.permissions = staff_in.permissions
        membership.status = MembershipStatus.PENDING
    else:
        # Create a new PENDING membership
        membership = LabMembership(
            user_id=target_user.id,
            lab_id=lab_id,
            permissions=staff_in.permissions,
            status=MembershipStatus.PENDING,
            otp_hash=hashed_otp,
            otp_expires_at=expiration
        )
        db.add(membership)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate staff addition."
        )

    # 🚀 IN PRODUCTION: Integrate AWS SNS, Twilio, or SendGrid here to dispatch `raw_otp`
    # For now, we will print it to the server console so you can test it locally
    print(f"--- OTP FOR {target_user.email}: {raw_otp} ---")

    return {"message": "OTP successfully generated and sent.", "expires_in_minutes": 15}


# ==========================================
# 2. VERIFY OTP & GRANT ACCESS
# ==========================================
@router.post("/verify", response_model=StaffResponse, status_code=status.HTTP_200_OK)
def verify_staff_addition(
    lab_id: uuid.UUID,
    verify_in: StaffAddVerify,
    db: Session = Depends(get_db),
    token_payload: TokenPayload = Depends(require_lab_permission("owner"))
):
    """
    Step 2: Verifies the provided OTP against the hashed database value.
    If successful, activates the staff member.
    """
    # Look up the target user
    stmt = select(User)
    if verify_in.email:
        stmt = stmt.where(User.email == verify_in.email)
    else:
        stmt = stmt.where(User.mobile_number == verify_in.mobile_number)
        
    target_user = db.execute(stmt).scalars().first()
    
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Find the PENDING membership
    mem_stmt = select(LabMembership).where(
        LabMembership.user_id == target_user.id,
        LabMembership.lab_id == lab_id,
        LabMembership.status == MembershipStatus.PENDING
    )
    membership = db.execute(mem_stmt).scalars().first()

    if not membership or not membership.otp_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No pending invitation found for this user."
        )

    # Verify Expiration
    if membership.otp_expires_at and membership.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="OTP has expired. Please initiate a new request."
        )

    # Verify Cryptographic Hash
    if not pwd_context.verify(verify_in.otp, membership.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid OTP."
        )

    # Activate User & Destroy OTP Evidence
    membership.status = MembershipStatus.ACTIVE
    membership.otp_hash = None
    membership.otp_expires_at = None

    try:
        db.commit()
        db.refresh(membership)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate staff member."
        )

    return membership


# ==========================================
# 3. GET ALL STAFF FOR A LAB
# ==========================================
@router.get("/", response_model=list[StaffResponse], status_code=status.HTTP_200_OK)
def get_lab_staff(
    lab_id: uuid.UUID,
    db: Session = Depends(get_db),
    # Any active staff member can view their colleagues
    token_payload: TokenPayload = Depends(require_lab_permission("read_lab_settings"))
):
    """
    Retrieves all staff members and their statuses for a specific laboratory.
    """
    stmt = select(LabMembership).where(LabMembership.lab_id == lab_id)
    staff_members = db.execute(stmt).scalars().all()
    
    return list(staff_members)


# ==========================================
# 4. UPDATE STAFF PERMISSIONS / STATUS
# ==========================================
@router.patch("/{user_id}", response_model=StaffResponse, status_code=status.HTTP_200_OK)
def update_staff_permissions(
    lab_id: uuid.UUID,
    user_id: uuid.UUID,
    staff_update: StaffUpdate,
    db: Session = Depends(get_db),
    token_payload: TokenPayload = Depends(require_lab_permission("owner"))
):
    """
    Updates the permissions or the active/suspended status of an existing staff member.
    """
    # 🛡️ ANTI-LOCKOUT: Prevent the owner from accidentally demoting or suspending themselves
    if str(user_id) == token_payload.sub:
        if staff_update.permissions and "owner" not in staff_update.permissions:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove 'owner' status from yourself.")
        if staff_update.status and staff_update.status != MembershipStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot suspend your own account.")

    stmt = select(LabMembership).where(
        LabMembership.lab_id == lab_id,
        LabMembership.user_id == user_id
    )
    membership = db.execute(stmt).scalars().first()

    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")

    if staff_update.permissions is not None:
        membership.permissions = staff_update.permissions
    if staff_update.status is not None:
        membership.status = staff_update.status

    try:
        db.commit()
        db.refresh(membership)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update staff.")

    return membership


# ==========================================
# 5. REMOVE STAFF FROM LAB
# ==========================================
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_staff_member(
    lab_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    token_payload: TokenPayload = Depends(require_lab_permission("owner"))
):
    """
    Revokes a user's access to the laboratory entirely.
    """
    if str(user_id) == token_payload.sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from your own laboratory. Transfer ownership first."
        )

    stmt = select(LabMembership).where(
        LabMembership.lab_id == lab_id,
        LabMembership.user_id == user_id
    )
    membership = db.execute(stmt).scalars().first()

    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")

    try:
        db.delete(membership)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove staff.")