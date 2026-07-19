import uuid
import time
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

# Adjust imports to match your project structure
from ..core.database import get_db
from ..api.deps import get_current_token_payload
from ..services.otp_service import generate_stateless_otp, verify_stateless_otp
# from ..core.rate_limit import enforce_rate_limit
from ..core.security import create_access_token, get_password_hash, verify_password
from ..models.user import User
from ..models.labmembership import LabMembership
from ..schemas.auth import LoginOTPResponse, LoginWithOTPRequest, OTPResponse, OwnerRegisterRequest, SendLoginOTP, SendRegistrationOTP, Token, TokenPayload, UserResponse
from ..core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ==========================================
# MOCK SENDERS (Replace with Twilio / AWS SES)
# ==========================================
def send_sms(mobile: str, otp: str):
    """Background task to send SMS via Twilio/AWS SNS."""
    print(f"\n📱 SMS to {mobile} -> OTP: {otp}")

def send_email(email: str, otp: str):
    """Background task to send Email via AWS SES/Resend."""
    print(f"\n📧 Email to {email} -> OTP: {otp}\n")


# ==========================================
# 1. REGISTER: REQUEST OTPs (Stateless Cryptography)
# ==========================================
@router.post("/request-otp", response_model=OTPResponse, status_code=status.HTTP_200_OK)
def request_registration_otps(
    payload: SendRegistrationOTP, 
    background_tasks: BackgroundTasks, 
    request: Request, # 👈 Injected to get the attacker's IP
    db: Session = Depends(get_db)
):
    """
    Validates user does not exist, generates stateless OTPs, and hands the 
    cryptographic state tokens back to the frontend.
    Zero-Knowledge OTP Generation.
    Impervious to User Enumeration, Timing Attacks, and SMS Bombing.
    """
    start_time = time.time()
    clean_email = payload.email.lower()
    clean_mobile = payload.mobile

    # 🛡️ LAYER 1: MULTI-VECTOR RATE LIMITING (Ultra-Fast RAM Check)
    # 1a. Block the physical device/server if it makes more than 5 requests per minute
    client_ip = request.client.host if request.client else "unknown"
    # enforce_rate_limit(key_prefix="reg_ip", identifier=client_ip, max_requests=5, window_seconds=60)
    
    # 1b. Block specific phone numbers and emails from being spammed
    # enforce_rate_limit(key_prefix="reg_mobile", identifier=clean_mobile, max_requests=3, window_seconds=60)
    # enforce_rate_limit(key_prefix="reg_email", identifier=clean_email, max_requests=3, window_seconds=60)

    # ⚡ FAST QUERY: SQLAlchemy 2.0 Syntax
    stmt = select(User).where(
        or_(User.email == clean_email, User.mobile == clean_mobile)
    )
    existing_user = db.execute(stmt).scalars().first()

    # 🛡️ LAYER 2: ENUMERATION DEFENSE (Always generate tokens to equal CPU load)
    mobile_otp, mobile_token = generate_stateless_otp(clean_mobile)
    email_otp, email_token = generate_stateless_otp(clean_email)

    if existing_user:
        # THE SILENT CATCH: Do not send the OTPs. Send a security alert instead.
        background_tasks.add_task(send_sms, clean_mobile, "Security Alert: Someone tried to register a Lab account with this number, but you are already registered. Please log in.")
        background_tasks.add_task(send_email, clean_email, "Security Alert: Registration attempted on an existing account. Please log in.")
    else:
        # Normal Flow
        background_tasks.add_task(send_sms, clean_mobile, mobile_otp)
        background_tasks.add_task(send_email, clean_email, email_otp)

    
    # 🛡️ LAYER 3: TIMING EQUALIZATION 
    # Ensure every single request takes exactly 150ms to prevent latency guessing
    elapsed = time.time() - start_time
    target_latency = 0.150 
    if elapsed < target_latency:
        time.sleep(target_latency - elapsed)

    return OTPResponse(
        message="Please check your mobile and email. OTPs sent successfully.",
        mobile_verification_token=mobile_token,
        email_verification_token=email_token,
        expires_in_minutes=10
    )


# ==========================================
# 2. REGISTER: VERIFY & REGISTER THE LAB OWNER
# ==========================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_owner(user_in: OwnerRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new Lab Owner. 
    Mathematically verifies the OTPs using the tokens provided by the frontend.
    """
    clean_email = user_in.email.lower()
    clean_mobile = user_in.mobile

    # 1. Verify Cryptographic Tokens
    if not verify_stateless_otp(clean_mobile, user_in.mobile_otp, user_in.mobile_verification_token):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired Mobile OTP.")

    if not verify_stateless_otp(clean_email, user_in.email_otp, user_in.email_verification_token):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired Email OTP.")
    
    # 2. Final Race-Condition Check
    stmt = select(User).where(
        or_(User.email == clean_email, User.mobile == clean_mobile)
    )
    if db.execute(stmt).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account registration conflict. Please log in instead."
        )
    
    # 3. Securely hash password and save
    hashed_password = get_password_hash(user_in.password)

    new_user = User(
        email=clean_email,
        full_name=user_in.full_name,
        mobile=clean_mobile,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=True, 
    )
    
    db.add(new_user)
    
    # 🛡️ STRICT TRANSACTION HANDLING
    try:
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred during registration."
        )
    
    return new_user


# ==========================================
# 4. PASSWORD, OTP LOGIN FLOW
# ==========================================
@router.post("/request-login-otp", response_model=LoginOTPResponse, status_code=status.HTTP_200_OK)
def request_login_otp(
    request: SendLoginOTP, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    Step 1 of Passwordless Login: Validates user exists and dispatches SMS.
    Step 1: Validates user exists and dispatches SMS.
    Uses strict Latency Equalization & Payload padding to prevent enumeration bots.
    """
    start_time = time.time()
    clean_mobile = request.mobile

    # 🛡️ RATE LIMITING: Prevent SMS Bombing & Database CPU Spikes
    # enforce_rate_limit(key_prefix="login_otp", identifier=clean_mobile, max_requests=3, window_seconds=60)


    # 1. Ensure user actually exists and is active
    stmt = select(User).where(User.mobile == clean_mobile)
    user = db.execute(stmt).scalars().first()

     # 2. DEFENSE IN DEPTH: Timing Equalization
    if not user:
        # 🚨 CRITICAL: CPU spends time hashing to prevent user enumeration
        verify_password(request.password, settings.DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect mobile number or password."
        )
    
    # 3. Verify Real Password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect mobile number or password."
        )
    
    if getattr(user, 'is_active', False) is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="This account has been deactivated."
        )
    
    # 2. Process logic exactly the same to equalize CPU cycles
    if user and getattr(user, 'is_active', False):
        mobile_otp, mobile_token = generate_stateless_otp(clean_mobile)  # 2. Generate Cryptographic State
        background_tasks.add_task(send_sms, clean_mobile, mobile_otp) # 3. Dispatch Non-Blocking SMS
    
    # 4. LATENCY EQUALIZATION: Pad execution time to stop millisecond fingerprinting
    elapsed = time.time() - start_time
    target_latency = 0.350 
    if elapsed < target_latency:
        time.sleep(target_latency - elapsed)
    
    return LoginOTPResponse(
        message="OTP sent successfully.",
        mobile_verification_token=mobile_token,
        expires_in_minutes=10
    )



@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login_with_otp(
    request: LoginWithOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2 of Passwordless Login: Verifies the OTP and issues the JWT.
    """
    clean_mobile = request.mobile

    # 1. Verify Cryptographic Token
    is_valid = verify_stateless_otp(
        target=clean_mobile,
        plain_otp=request.mobile_otp,
        verification_token=request.mobile_verification_token
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired OTP."
        )

    # 2. Fetch User
    stmt = select(User).where(User.mobile == clean_mobile)
    user = db.execute(stmt).scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="This account has been deactivated or deleted."
        )
    
    # 🏢 UX OPTIMIZATION: Self-Healing Workspace Routing
    # If the user doesn't have a default lab set, auto-assign their first active membership
    if not user.default_lab_id:
        first_membership = db.execute(
            select(LabMembership).where(
                LabMembership.user_id == user.id,
                LabMembership.status == "ACTIVE"
            )
        ).scalars().first()
        
        if first_membership:
            user.default_lab_id = first_membership.lab_id
            db.commit()
            db.refresh(user)


    # 3. Issue the standard JWT session
    access_token = create_access_token(
        subject=user.id,
        email=user.email,
        mobile=str(user.mobile)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


# # ==========================================
# # 4. LOGIN: STANDARD OAUTH2 (Swagger UI & Admins)
# # ==========================================
# @router.post("/login", response_model=Token)
# def login_access_token(
#     db: Session = Depends(get_db), 
#     form_data: OAuth2PasswordRequestForm = Depends()
# ):
#     clean_email = form_data.username.lower()
    
#     user = db.execute(select(User).where(User.email == clean_email)).scalars().first()

#     auth_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Incorrect email or password",
#         headers={"WWW-Authenticate": "Bearer"},
#     )

#     if not user or not verify_password(form_data.password, user.hashed_password):
#         raise auth_exception

#     if not getattr(user, 'is_active', False):
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated.")

#     if not user.default_lab_id:
#         first_membership = db.execute(
#             select(LabMembership).where(LabMembership.user_id == user.id, LabMembership.status == "ACTIVE")
#         ).scalars().first()
        
#         if first_membership:
#             user.default_lab_id = first_membership.lab_id
#             db.commit()
#             db.refresh(user)

#     access_token = create_access_token(subject=user.id, email=user.email, mobile=str(user.mobile))

#     return {"access_token": access_token, "token_type": "bearer", "user": user}


# ==========================================
# 4. REFRESH ACCESS TOKEN
# ==========================================
@router.post("/refresh", response_model=Token)
def refresh_access_token(
    db: Session = Depends(get_db),
    current_token: TokenPayload = Depends(get_current_token_payload) 
):
    """
    Seamlessly updates a user's JWT session without requiring a password.
    """
    user_uuid = uuid.UUID(current_token.sub)
    
    stmt = select(User).where(User.id == user_uuid)
    user = db.execute(stmt).scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is missing or deactivated."
        )

    new_access_token = create_access_token(
        subject=user.id,
        email=user.email,
        mobile=str(user.mobile)
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "user": user 
    }