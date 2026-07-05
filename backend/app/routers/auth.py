import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..core.database import get_db
from ..api.deps import get_current_token_payload
from ..services.otp_service import generate_stateless_otp, verify_stateless_otp
from ..core.security import create_access_token, get_password_hash, verify_password
from ..models.user import User
from ..schemas.auth import OTPResponse, OwnerRegisterRequest, SendRegistrationOTP, Token, TokenPayload, UserResponse


router = APIRouter(prefix="/auth")


# MOCK SENDERS (Replace with Twilio / AWS SES)
def send_sms(mobile: str, otp: str):
    """Background task to send SMS via Twilio/Firebase."""
    print(f"\n📱 SMS to {mobile} -> OTP: {otp}")

def send_email(email: str, otp: str):
    """Background task to send Email via AWS SES/Resend."""
    print(f"\n📧 Email to {email} -> OTP: {otp}\n")


# ==========================================
# 1. REQUEST OTPs (Stateless Cryptography)
# ==========================================
@router.post("/request-otp", response_model=OTPResponse, status_code=status.HTTP_200_OK)
def request_registration_otps(
    request: SendRegistrationOTP, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    Validates user does not exist, generates stateless OTPs, and hands the 
    cryptographic state tokens back to the frontend.
    """
    clean_email = request.email.lower()
    clean_mobile = request.mobile

    existing_user = db.query(User).filter(
        or_(User.email == clean_email, User.mobile == clean_mobile)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email or mobile number already exists."
        )

    mobile_otp, mobile_token = generate_stateless_otp(clean_mobile)
    email_otp, email_token = generate_stateless_otp(clean_email)

    background_tasks.add_task(send_sms, clean_mobile, mobile_otp)
    background_tasks.add_task(send_email, clean_email, email_otp)

    return OTPResponse(
        message="OTPs sent successfully. Tokens expire in 10 minutes.",
        mobile_verification_token=mobile_token,
        email_verification_token=email_token,
        expires_in_minutes=10
    )


# ==========================================
# 2. VERIFY & REGISTER THE LAB OWNER
# ==========================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_owner(user_in: OwnerRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new Lab Owner. 
    Mathematically verifies the OTPs using the tokens provided by the frontend.
    """
    clean_email = user_in.email.lower()
    clean_mobile = user_in.mobile

    is_mobile_valid = verify_stateless_otp(
        target=clean_mobile,
        plain_otp=user_in.mobile_otp,
        verification_token=user_in.mobile_verification_token
    )
    if not is_mobile_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired Mobile OTP.")

    is_email_valid = verify_stateless_otp(
        target=clean_email,
        plain_otp=user_in.email_otp,
        verification_token=user_in.email_verification_token
    )
    if not is_email_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired Email OTP.")
    
    existing_user = db.query(User).filter(
        or_(
            User.email == clean_email,
            User.mobile == user_in.mobile if user_in.mobile else False
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email or mobile number already exists."
        )
    
    hashed_password = get_password_hash(user_in.password)

    new_user = User(
        email=clean_email,
        full_name=user_in.full_name,
        mobile=user_in.mobile,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=True, 
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# ==========================================
# 3. LOGIN & GENERATE STATELESS JWT
# ==========================================
@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login. 
    Compiles the user's multi-tenant permissions into a blazing fast JWT payload.
    """
    clean_email = form_data.username.lower()
    user = db.query(User).filter(User.email == clean_email).first()

    auth_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise auth_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="This account has been deactivated."
        )

    # lab_permissions = {}

    # for lab in user.owned_labs:
    #     lab_permissions[str(lab.id)] = ["owner"]

    # for membership in user.memberships:
    #     lab_permissions[str(membership.lab_id)] = membership.permissions

    access_token = create_access_token(
        subject=user.id,
        email=user.email,
        mobile=str(user.mobile),
        # lab_permissions=lab_permissions
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user 
    }


# ==========================================
# 4. REFRESH ACCESS TOKEN
# ==========================================
@router.post("/refresh", response_model=Token)
def refresh_access_token(
    db: Session = Depends(get_db),
    current_token: TokenPayload = Depends(get_current_token_payload) 
):
    """
    Seamlessly updates a user's JWT permissions without requiring a password.
    Call this immediately after creating a lab, or if an admin grants them new roles.
    """
    # CRITICAL FIX: Cast the string token 'sub' to a UUID object to prevent .hex error
    user_uuid = uuid.UUID(current_token.sub)
    user = db.query(User).filter(User.id == user_uuid).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is missing or deactivated."
        )

    # lab_permissions = {}
    
    # for lab in user.owned_labs:
    #     lab_permissions[str(lab.id)] = ["owner"]
        
    # for membership in user.memberships:
    #     lab_permissions[str(membership.lab_id)] = membership.permissions

    new_access_token = create_access_token(
        subject=user.id,
        email=user.email,
        mobile=str(user.mobile), 
        # lab_permissions=lab_permissions
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "user": user 
    }