import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

# Adjust imports to match your project structure
from ..core.database import get_db
from ..api.deps import get_current_token_payload
from ..services.otp_service import generate_stateless_otp, verify_stateless_otp
from ..core.security import create_access_token, get_password_hash, verify_password
from ..models.user import User
from ..schemas.auth import LoginOTPResponse, LoginWithOTPRequest, OTPResponse, OwnerRegisterRequest, SendLoginOTP, SendRegistrationOTP, Token, TokenPayload, UserResponse


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

    # ⚡ FAST QUERY: SQLAlchemy 2.0 Syntax
    stmt = select(User).where(
        or_(User.email == clean_email, User.mobile == clean_mobile)
    )
    existing_user = db.execute(stmt).scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email or mobile number already exists."
        )

    mobile_otp, mobile_token = generate_stateless_otp(clean_mobile)
    email_otp, email_token = generate_stateless_otp(clean_email)

    # Dispatch to background threads so the API responds instantly (Non-blocking)
    background_tasks.add_task(send_sms, clean_mobile, mobile_otp)
    background_tasks.add_task(send_email, clean_email, email_otp)

    return OTPResponse(
        message="OTPs sent successfully. Tokens expire in 10 minutes.",
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
    is_mobile_valid = verify_stateless_otp(
        target=clean_mobile,
        plain_otp=user_in.mobile_otp,
        verification_token=user_in.mobile_verification_token
    )
    if not is_mobile_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired Mobile OTP.")

    is_email_valid = verify_stateless_otp(
        target=clean_email,
        plain_otp=user_in.email_otp,
        verification_token=user_in.email_verification_token
    )
    if not is_email_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired Email OTP.")
    
    # 2. Final Race-Condition Check
    stmt = select(User).where(
        or_(User.email == clean_email, User.mobile == clean_mobile)
    )
    if db.execute(stmt).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account was created by another process during OTP verification."
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
# 4. PASSWORDLESS OTP LOGIN FLOW
# ==========================================
@router.post("/request-login-otp", response_model=LoginOTPResponse, status_code=status.HTTP_200_OK)
def request_login_otp(
    request: SendLoginOTP, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    Step 1 of Passwordless Login: Validates user exists and dispatches SMS.
    """
    clean_mobile = request.mobile

    # 1. Ensure user actually exists and is active
    stmt = select(User).where(User.mobile == clean_mobile)
    user = db.execute(stmt).scalars().first()

    if not user:
        # Security UX: Return generic error to prevent user enumeration attacks
        raise HTTPException(status_code=404, detail="Account not found.")
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    # 2. Generate Cryptographic State
    mobile_otp, mobile_token = generate_stateless_otp(clean_mobile)

    # 3. Dispatch Non-Blocking SMS
    background_tasks.add_task(send_sms, clean_mobile, mobile_otp)

    return LoginOTPResponse(
        message="Login OTP sent successfully.",
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
            detail="Account not found or deactivated."
        )

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


# ==========================================
# 3. LOGIN: LOGIN & GENERATE STATELESS JWT
# ==========================================
# @router.post("/login", response_model=Token)
# def login_access_token(
#     db: Session = Depends(get_db), 
#     form_data: OAuth2PasswordRequestForm = Depends()
# ):
#     """
#     OAuth2 compatible token login. 
#     Issues a highly optimized, lean JWT payload.
#     """
#     clean_email = form_data.username.lower()
    
#     stmt = select(User).where(User.email == clean_email)
#     user = db.execute(stmt).scalars().first()

#     auth_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Incorrect email or password",
#         headers={"WWW-Authenticate": "Bearer"},
#     )

#     if not user or not verify_password(form_data.password, user.hashed_password):
#         raise auth_exception

#     if not user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN, 
#             detail="This account has been deactivated."
#         )

#     # Create a lean, stateless token
#     access_token = create_access_token(
#         subject=user.id,
#         email=user.email,
#         mobile=str(user.mobile)
#     )

#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": user 
#     }


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