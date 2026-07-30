import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.user import User
from ..services.totp_service import TOTPService
from ..services.email_service import mask_email  # Import compliant data masking helper

# 🛡️ COMPLIANCE: Secure Audit Logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/totp")


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class SetupTOTPRequest(BaseModel):
    email: EmailStr


class SetupTOTPResponse(BaseModel):
    secret: str
    qr_code_base64: str
    message: str


class VerifyTOTPRequest(BaseModel):
    email: EmailStr
    code: str


class EnableTOTPResponse(BaseModel):
    message: str
    backup_codes: list[str]


class VerifyBackupCodeRequest(BaseModel):
    email: EmailStr
    backup_code: str


class BackupVerificationResponse(BaseModel):
    message: str
    remaining_backup_codes: int
    access_token: str


class RegenerateBackupCodesResponse(BaseModel):
    message: str
    backup_codes: list[str]


class DisableTOTPRequest(BaseModel):
    email: EmailStr
    code: str


# ==========================================
# ENDPOINTS
# ==========================================

@router.post("/setup", response_model=SetupTOTPResponse)
async def setup_totp(request: SetupTOTPRequest, db: Session = Depends(get_db)):
    """
    Step 1: Generates the secret and QR code.
    Does NOT enforce 2FA yet (user must prove they scanned it first).
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="2FA is already enabled on this account."
        )

    # Generate and temporarily store the secret
    secret = TOTPService.generate_secret()
    user.totp_secret = secret
    db.commit()

    qr_base64 = TOTPService.generate_qr_base64(email=user.email, secret=secret)

    return SetupTOTPResponse(
        secret=secret,  # Raw text fallback for manual entry
        qr_code_base64=qr_base64,
        message="Scan the QR code in your Authenticator app, or enter the text secret manually."
    )


@router.post("/enable", response_model=EnableTOTPResponse)
async def enable_totp(request: VerifyTOTPRequest, db: Session = Depends(get_db)):
    """
    Step 2: Verifies the first code from the authenticator app.
    If successful, permanently enables 2FA and issues 10 single-use backup codes.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="TOTP setup has not been initiated."
        )

    # 1. Verify initial authenticator code
    is_valid = TOTPService.verify_code(user.totp_secret, request.code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid verification code. Please check your authenticator clock."
        )

    # 2. Generate backup codes & hash them for DB storage
    raw_codes = TOTPService.generate_backup_codes(count=10)
    plain_codes, hashed_codes_json = TOTPService.process_backup_codes(raw_codes)

    # 3. Save hashed version to DB & activate 2FA
    user.is_totp_enabled = True
    user.backup_codes = hashed_codes_json
    db.commit()

    logger.info("2FA successfully enabled for user %s", mask_email(request.email))

    return EnableTOTPResponse(
        message="2FA successfully enabled. Save these backup codes in a safe place. They will NOT be shown again.",
        backup_codes=plain_codes
    )


@router.post("/verify")
async def verify_login_totp(request: VerifyTOTPRequest, db: Session = Depends(get_db)):
    """
    Standard 2FA login verification endpoint during sign-in.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.is_totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="2FA is not enabled for this account."
        )

    is_valid = TOTPService.verify_code(user.totp_secret, request.code)
    if not is_valid:
        logger.warning("Failed 2FA verification attempt for %s", mask_email(request.email))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired verification code."
        )

    logger.info("2FA verification successful for %s", mask_email(request.email))

    # TODO: Replace with your actual JWT Access Token creation logic
    access_token = "mock_jwt_access_token_here"

    return {
        "message": "Authentication successful",
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/verify-backup", response_model=BackupVerificationResponse)
async def verify_backup_code(request: VerifyBackupCodeRequest, db: Session = Depends(get_db)):
    """
    Emergency login endpoint using a single-use backup code.
    Consumes the code upon successful verification.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.is_totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="2FA is not enabled for this user."
        )

    # 1. Verify and consume the backup code atomically
    is_valid, updated_hashes_json, remaining_count = TOTPService.verify_and_consume_backup_code(
        user.backup_codes, 
        request.backup_code
    )

    masked = mask_email(request.email)

    if not is_valid:
        logger.warning("Failed backup code attempt for %s", masked)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or previously used backup code."
        )

    # 2. Persist the consumed state in Database
    user.backup_codes = updated_hashes_json
    db.commit()

    logger.info("Backup code consumed successfully for %s. Remaining: %d", masked, remaining_count)

    # TODO: Replace with your actual JWT Access Token creation logic
    access_token = "mock_jwt_access_token_here"

    return BackupVerificationResponse(
        message=f"Authentication successful. You have {remaining_count} backup codes remaining.",
        remaining_backup_codes=remaining_count,
        access_token=access_token
    )


@router.post("/regenerate-backup-codes", response_model=RegenerateBackupCodesResponse)
async def regenerate_backup_codes(request: VerifyTOTPRequest, db: Session = Depends(get_db)):
    """
    Replaces all existing backup codes with a new set of 10 single-use codes.
    Requires a valid TOTP code to confirm identity.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.is_totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="2FA is not enabled on this account."
        )

    # Verify identity via TOTP code
    if not TOTPService.verify_code(user.totp_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid verification code."
        )

    # Generate new set of 10 backup codes
    raw_codes = TOTPService.generate_backup_codes(count=10)
    plain_codes, hashed_codes_json = TOTPService.process_backup_codes(raw_codes)

    user.backup_codes = hashed_codes_json
    db.commit()

    logger.info("Backup codes regenerated for %s", mask_email(request.email))

    return RegenerateBackupCodesResponse(
        message="New backup codes generated. Previous codes have been invalidated.",
        backup_codes=plain_codes
    )


@router.post("/disable")
async def disable_totp(request: DisableTOTPRequest, db: Session = Depends(get_db)):
    """
    Disables 2FA on the account. Requires a valid TOTP code to confirm identity.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.is_totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="2FA is not enabled on this account."
        )

    # Verify identity via TOTP code before disabling
    if not TOTPService.verify_code(user.totp_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid verification code."
        )

    user.is_totp_enabled = False
    user.totp_secret = None
    user.backup_codes = None
    db.commit()

    logger.info("2FA disabled for user %s", mask_email(request.email))

    return {"message": "Two-factor authentication has been disabled."}