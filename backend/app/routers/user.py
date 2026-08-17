import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..api.deps import get_current_active_user, require_super_admin
from ..schemas.auth import UserResponse
from ..models.user import User

# Enterprise Standard: Dedicated logger for security & audit events
logger = logging.getLogger("security_audit")

router = APIRouter(prefix="/users", tags=["Users"])

# ==========================================
# 1. THE LIGHTNING PING (Zero-Trust Session Verification)
# ==========================================
@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def read_users_me(
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    """
    ⚡ THE LIGHTNING PING
    If execution reaches here, both the user AND their lab are guaranteed active.
    It automatically skips the Lab check if the user is a Platform Admin (no default_lab_id).
    """
    
    # 🛡️ COMPLIANCE: Audit Trail Logging (HIPAA / ABDM Standard)
    client_ip = request.client.host if request.client else "Unknown IP"
    logger.debug(f"[AUDIT] Profile accessed by UUID: {current_user.id} | IP: {client_ip}")
    
    return current_user


# ==========================================
# 2. ENTERPRISE SOFT-DELETE (Admin Only)
# ==========================================
@router.delete("/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    target_user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    # 🛡️ THE BOUNCER: Only Platform Admins can trigger this endpoint
    current_admin: User = Depends(require_super_admin) 
):
    """
    Safely disables a user account.
    Maintains full database integrity for medical records and invoices.
    """
    # 1. Prevent self-deletion (Lockout Protection)
    if target_user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Action Denied: You cannot delete your own admin account."
        )

    # 2. Fetch the target user
    target_user = db.execute(
        select(User).where(User.id == target_user_id)
    ).scalars().first()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found in the database."
        )

    if not target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is already deleted/deactivated."
        )

    # 3. 🚀 THE SOFT DELETE
    # This instantly revokes their JWT access across the entire platform
    target_user.is_active = False
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error during user deletion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while attempting to delete the user."
        )

    # 4. Audit Trail Logging
    client_ip = request.client.host if request.client else "Unknown IP"
    logger.warning(
        f"[AUDIT - HIGH RISK] Admin '{current_admin.email}' deleted User '{target_user.email}' "
        f"(UUID: {target_user_id}) from IP: {client_ip}"
    )

    return None
# from fastapi import APIRouter, Depends, status
# from sqlalchemy.orm import Session

# from ..api.deps import get_current_active_user
# from ..schemas.auth import UserResponse
# from ..models.user import User

# router = APIRouter(prefix="/users")

# # ==========================================
# # 1. THE LIGHTNING PING (Session Verification)
# # ==========================================
# @router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
# def read_users_me(
#     # This single line handles JWT validation, DB lookup, AND active status check
#     current_user: User = Depends(get_current_active_user)
# ):
#     """
#     Frontend Session Ping: 
#     Returns the current user's profile. If the user was deactivated 5 seconds ago,
#     this will instantly throw a 403 Forbidden, forcing the frontend to log them out.
#     """
#     return current_user