import re
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, UUID4, field_validator, model_validator


# ==========================================
# BASE USER BLUEPRINT
# ==========================================
class UserBase(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User's primary email address.",
        examples=["email@example.com"]
    )
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="User's legal full name.",
        examples=["Full Name"]
    )
    mobile: str = Field(
        ...,
        pattern=r'^\+?[1-9]\d{1,14}$', # International E.164 format
        min_length=10,
        max_length=15,
        description="User's mobile number.",
        examples=["+919876543210"]
    )

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


# ==========================================
# OTP REQUEST SCHEMA
# ==========================================
class SendRegistrationOTP(BaseModel):
    mobile: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
    email: EmailStr = Field(..., description="Mandatory email to receive the second OTP.")


# ==========================================
# OTP RESPONSE SCHEMA
# ==========================================
class OTPResponse(BaseModel):
    message: str = Field(default="OTPs sent successfully.")
    mobile_verification_token: str = Field(..., description="State token for mobile verification.")
    email_verification_token: str = Field(..., description="State token for email verification.")
    expires_in_minutes: int = Field(default=10)


# ==========================================
# OWNER REGISTRATION (Verify & Create)
# ==========================================
class OwnerRegisterRequest(UserBase):
    password: str = Field(
        ...,
        min_length=12,
        max_length=128,
        description="User's password."
    )
    
    # --- THE 6-DIGIT CODES TYPED BY THE USER ---
    mobile_otp: str = Field(..., min_length=6, max_length=6, description="6-digit mobile OTP")
    email_otp: str = Field(..., min_length=6, max_length=6, description="6-digit email OTP")

    # --- THE STATELESS TOKENS RETURNED BY THE FRONTEND ---
    mobile_verification_token: str = Field(..., description="The JWT token returned during Step 1.")
    email_verification_token: str = Field(..., description="The JWT token returned during Step 1.")

    @field_validator('password')
    @classmethod
    def enforce_password_complexity(cls, v:str) -> str:
        """
        Hardens authentication. Rejects basic dictionary attacks.
        Requires: 1 Uppercase, 1 Lowercase, 1 Number, and 1 Special Character.
        """
        complexity_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$'
        if not re.match(complexity_regex, v):
            raise ValueError(
                "Password strength insufficient. Must contain at least one uppercase letter, "
                "one lowercase letter, one numeric digit, and one special symbol."
            )
        return v
    
    @model_validator(mode='after')
    def validate_conditional_otps(self) -> 'OwnerRegisterRequest':
        """
        Cross-field validation: Ensures that if an email or mobile was provided, 
        the corresponding OTP is also present.
        """
        if self.email and not self.email_otp:
            raise ValueError("An Email OTP is required because an email address was provided.")
        if self.mobile and not self.mobile_otp:
            raise ValueError("A Mobile OTP is required because a mobile number was provided.")
        return self
    

# ==========================================
# SECURE USER OUTPUT FILTER
# ==========================================
class UserResponse(UserBase):
    id: UUID4 = Field(description="Immutable, cryptographically safe unique identifier.")
    is_active: bool = Field(default=False, description="Indicates if the user profile is active or suspended.")
    is_verified: bool = Field(default=False, description="Indicates if the user profile is verified.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Modern Pydantic V2 framework configuration
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# STATELESS TOKEN ARCHITECTURE
# ==========================================
class TokenPayload(BaseModel):
    """
    Decrypted JWT inner payload structure. 
    Kept lean to reduce token size and HTTP header bloat.
    """
    sub: str = Field(..., description="The User UUID string acting as the token subject.")
    exp: int = Field(..., description="Token expiration Unix timestamp.")
    email: EmailStr
    mobile: str


class Token(BaseModel):
    """The immediate response schema delivered following successful login."""
    access_token: str = Field(..., description="The cryptographically signed JWT bearer token string.")
    token_type: str = Field(default="bearer", description="Explicit standard authorization transport token type.")
    user: UserResponse = Field(..., description="The filtered user details profile to initialize client-side states.")