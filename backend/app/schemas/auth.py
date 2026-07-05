import re
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, UUID4, field_validator, model_validator


# BASE USER BLUEPRINT
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
        description="User's legalfull name.",
        examples=["Full Name"]
    )
    mobile: str = Field(
        ...,
        pattern=r'^\+?[1-9]\d{1,14}$', # International E.164 format
        min_length=10,
        max_length=15,
        description="User's mobile number.",
        examples=["+1234567890"]
    )

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


# OTP REQUEST SCHEMA, (Payload sent by frontend to trigger the OTP generation.)
class SendRegistrationOTP(BaseModel):
    mobile: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
    email: EmailStr = Field(..., description="Mandatory email to receive the second OTP.")


#  """The response sent BACK to the frontend containing the stateless cryptographic tokens."""
class OTPResponse(BaseModel):
    message: str = Field(default="OTPs sent successfully.")
    mobile_verification_token: str = Field(..., description="State token for mobile verification.")
    email_verification_token: str = Field(..., description="State token for email verification.")
    expires_in_minutes: int = Field(default=10)


# Owner Registration Input & VERIFY (Inherits from UserBase. Adds password and the required OTP fields.)
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
        Cross-field validation: Ensures that if an email was provided, 
        the user also supplied the email_otp.
        """
        if self.email and not self.email_otp:
            raise ValueError("An Email OTP is required because an email address was provided.")
        elif not self.email and self.email_otp:
            raise ValueError("Email OTP provided, but no email address was specified.")
        elif self.mobile and not self.mobile_otp:
            raise ValueError("An Mobile OTP is required because an mobile number address was provided.")
        elif not self.mobile and self.mobile_otp:
            raise ValueError("Mobile OTP provided, but no mobile number was specified.")
        return self
    

# SECURE USER OUTPUT FILTER
class UserResponse(UserBase):
    id: UUID4 = Field(description="Immutable, cryptographically safe unique identifier preventing IDOR enumeration attacks.")
    is_active: bool = Field(default=False, description="Indicates if the user profile is active or suspended.")
    is_verified: bool = Field(default=False, description="Indicated if the user profile is verfied or not.")
    # is_platform_admin: bool = Field(default=False, description="Flag designating SaaS super-admin system access.")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Modern Pydantic V2 framework configuration for mapping direct database models (ORM objects)
    model_config = ConfigDict(from_attributes=True)


# STATELESS TOKEN ARCHITECTURE
class TokenPayload(BaseModel):
    """
    Decrypted JWT inner payload structure. 
    Enables blazing fast, zero-database-hit permission checks.
    """
    sub: str = Field(..., description="The User UUID string acting as the token subject.")
    exp: int = Field(..., description="Token expiration Unix timestamp.")
    email: EmailStr
    mobile: str
    
    # Fast multi-tenant dictionary structure: {"<lab_uuid_string>": ["owner", "admin", "intake"]}
    # lab_permissions: Dict[str, List[str]] = Field(default_factory=dict)


class Token(BaseModel):
    """The immediate response schema delivered following successful login credentials verification."""
    access_token: str = Field(..., description="The cryptographically signed JWT bearer token string.")
    token_type: str = Field(default="bearer", description="Explicit standard authorization transport token type.")
    user: UserResponse = Field(..., description="The filtered user details profile to initialize client-side states.")