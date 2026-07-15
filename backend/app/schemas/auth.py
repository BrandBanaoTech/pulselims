import re
from datetime import datetime, timezone
from typing import Annotated, Any, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, UUID4, field_validator, model_validator, BeforeValidator, StringConstraints, AfterValidator

# ==========================================
# 1. REUSABLE ENTERPRISE TYPES (The "DRY" Upgrade)
# ==========================================
def _format_indian_mobile(v: Any) -> str:
    """Forgiving mobile sanitizer. Casts ints to strings, strips spaces/dashes, adds +91."""
    v_str = str(v).strip() # Forgiving: In case frontend sends an integer instead of string
    sanitized = re.sub(r'[^\d+]', '', v_str)
    
    if len(sanitized) == 10 and not sanitized.startswith('+'):
        return f"+91{sanitized}"
    elif len(sanitized) == 11 and sanitized.startswith('0'):
        return f"+91{sanitized[1:]}"
    return sanitized

def _enforce_password_complexity(v: str) -> str:
    """Hardens authentication. Rejects basic dictionary attacks."""
    complexity_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$'
    if not re.match(complexity_regex, v):
        raise ValueError(
            "Password strength insufficient. Must contain at least one uppercase letter, "
            "one lowercase letter, one numeric digit, and one special symbol."
        )
    return v

# 🚀 PYDANTIC V2 MAGIC: We now have global, secure types we can use anywhere!
SanitizedMobile = Annotated[
    str, 
    BeforeValidator(_format_indian_mobile), 
    StringConstraints(pattern=r'^\+?[1-9]\d{1,14}$', min_length=10, max_length=15)
]

StrongPassword = Annotated[
    str, 
    StringConstraints(min_length=12, max_length=128), 
    AfterValidator(_enforce_password_complexity)
]


# ==========================================
# BASE USER BLUEPRINT
# ==========================================
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User's primary email address.", examples=["doctor@lab.com"])
    full_name: str = Field(..., min_length=2, max_length=150, description="User's legal full name.")
    
    # Just drop in our new enterprise type! 
    mobile: SanitizedMobile = Field(..., description="User's mobile number.", examples=["+919876543210"])

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


# ==========================================
# OTP REQUEST SCHEMA (Registration)
# ==========================================
class SendRegistrationOTP(BaseModel):
    mobile: SanitizedMobile
    email: EmailStr = Field(..., description="Mandatory email to receive the second OTP.")


# ==========================================
# LOGIN OTP REQUEST SCHEMA (2FA)
# ==========================================
class SendLoginOTP(BaseModel):
    mobile: SanitizedMobile
    password: str = Field(..., description="User password to enforce Multi-Factor Authentication (2FA).")


# ==========================================
# OTP RESPONSE SCHEMAS
# ==========================================
class OTPResponse(BaseModel):
    message: str = Field(default="OTPs sent successfully.")
    mobile_verification_token: str = Field(..., description="State token for mobile verification.")
    email_verification_token: str = Field(..., description="State token for email verification.")
    expires_in_minutes: int = Field(default=10)

class LoginOTPResponse(BaseModel):
    message: str = Field(default="OTP sent successfully.")
    mobile_verification_token: str = Field(..., description="State token for mobile verification.")
    expires_in_minutes: int = Field(default=10)


# ==========================================
# OWNER REGISTRATION (Verify & Create)
# ==========================================
class OwnerRegisterRequest(UserBase):
    # Use our global secure password type
    password: StrongPassword
    
    # 6-DIGIT CODES TYPED BY THE USER
    mobile_otp: str = Field(..., min_length=6, max_length=6, description="6-digit mobile OTP")
    email_otp: str = Field(..., min_length=6, max_length=6, description="6-digit email OTP")

    # STATELESS TOKENS RETURNED BY THE FRONTEND
    mobile_verification_token: str = Field(..., description="The JWT token returned during Step 1.")
    email_verification_token: str = Field(..., description="The JWT token returned during Step 1.")
    
    @model_validator(mode='after')
    def validate_conditional_otps(self) -> 'OwnerRegisterRequest':
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
    is_active: bool = Field(default=False)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    default_lab_id: Optional[UUID4] = Field(default=None)
    
    # 🛡️ STRICT OUTPUT FILTERING
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True # Automatically trims trailing spaces from names/emails before sending to frontend
    )


# ==========================================
# VERIFY LOGIN OTP SCHEMA (Passwordless Step 2)
# ==========================================
class LoginWithOTPRequest(BaseModel):
    mobile: SanitizedMobile
    mobile_otp: str = Field(..., min_length=6, max_length=6, description="6-digit mobile OTP")
    mobile_verification_token: str = Field(..., description="The JWT state token returned in Step 1")
    

# ==========================================
# STATELESS TOKEN ARCHITECTURE
# ==========================================
class TokenPayload(BaseModel):
    sub: str = Field(..., description="The User UUID string acting as the token subject.")
    exp: int = Field(..., description="Token expiration Unix timestamp.")
    email: EmailStr
    mobile: str

class Token(BaseModel):
    access_token: str = Field(..., description="The cryptographically signed JWT bearer token string.")
    token_type: str = Field(default="bearer")
    user: UserResponse = Field(..., description="The filtered user details profile to initialize client-side states.")
    
# import re
# from datetime import datetime, timezone
# from typing import Optional
# from pydantic import BaseModel, ConfigDict, EmailStr, Field, UUID4, field_validator, model_validator


# # ==========================================
# # BASE USER BLUEPRINT
# # ==========================================
# class UserBase(BaseModel):
#     email: EmailStr = Field(
#         ...,
#         description="User's primary email address.",
#         examples=["email@example.com"]
#     )
#     full_name: str = Field(
#         ...,
#         min_length=2,
#         max_length=150,
#         description="User's legal full name.",
#         examples=["Full Name"]
#     )
#     mobile: str = Field(
#         ...,
#         pattern=r'^\+?[1-9]\d{1,14}$', # International E.164 format
#         min_length=10,
#         max_length=15,
#         description="User's mobile number.",
#         examples=["+919876543210"]
#     )

#     @field_validator('full_name')
#     @classmethod
#     def validate_full_name(cls, v: str) -> str:
#         if not v.strip():
#             raise ValueError("Full name cannot be empty")
#         return v.strip()


# # ==========================================
# # OTP REQUEST SCHEMA
# # ==========================================
# class SendRegistrationOTP(BaseModel):
#     mobile: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
#     email: EmailStr = Field(..., description="Mandatory email to receive the second OTP.")


# # ==========================================
# #   LOGIN OTP REQUEST SCHEMA FOR LOGIN (2FA)
# # ==========================================
# class SendLoginOTP(BaseModel):
#     mobile: str = Field(
#         ..., 
#         pattern=r'^\+[1-9]\d{1,14}$',
#         description="The user's mobile number. Auto-formatted to E.164 standard.",
#         json_schema_extra={
#             "example": "+919876543210"
#         }
#     )
#     password: str = Field(
#         ..., 
#         description="User password to enforce Multi-Factor Authentication (2FA)."
#     )

#     @field_validator('mobile', mode='before')
#     @classmethod
#     def sanitize_and_format_mobile(cls, v: str) -> str:
#         if not isinstance(v, str):
#             raise ValueError("Mobile number must be a string")
#         sanitized = re.sub(r'[^\d+]', '', v)
#         if len(sanitized) == 10 and not sanitized.startswith('+'):
#             sanitized = f"+91{sanitized}"
#         elif len(sanitized) == 11 and sanitized.startswith('0'):
#             sanitized = f"+91{sanitized[1:]}"
#         return sanitized


# # ==========================================
# # OTP RESPONSE SCHEMA
# # ==========================================
# class OTPResponse(BaseModel):
#     message: str = Field(default="OTPs sent successfully.")
#     mobile_verification_token: str = Field(..., description="State token for mobile verification.")
#     email_verification_token: str = Field(..., description="State token for email verification.")
#     expires_in_minutes: int = Field(default=10)


# # ==========================================
# # LOGIN OTP RESPONSE SCHEMA
# # ==========================================
# class LoginOTPResponse(BaseModel):
#     message: str = Field(default="OTP sent successfully.")
#     mobile_verification_token: str = Field(..., description="State token for mobile verification.")
#     expires_in_minutes: int = Field(default=10)


# # ==========================================
# # OWNER REGISTRATION (Verify & Create)
# # ==========================================
# class OwnerRegisterRequest(UserBase):
#     password: str = Field(
#         ...,
#         min_length=12,
#         max_length=128,
#         description="User's password."
#     )
    
#     # --- THE 6-DIGIT CODES TYPED BY THE USER ---
#     mobile_otp: str = Field(..., min_length=6, max_length=6, description="6-digit mobile OTP")
#     email_otp: str = Field(..., min_length=6, max_length=6, description="6-digit email OTP")

#     # --- THE STATELESS TOKENS RETURNED BY THE FRONTEND ---
#     mobile_verification_token: str = Field(..., description="The JWT token returned during Step 1.")
#     email_verification_token: str = Field(..., description="The JWT token returned during Step 1.")

#     @field_validator('password')
#     @classmethod
#     def enforce_password_complexity(cls, v:str) -> str:
#         """
#         Hardens authentication. Rejects basic dictionary attacks.
#         Requires: 1 Uppercase, 1 Lowercase, 1 Number, and 1 Special Character.
#         """
#         complexity_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$'
#         if not re.match(complexity_regex, v):
#             raise ValueError(
#                 "Password strength insufficient. Must contain at least one uppercase letter, "
#                 "one lowercase letter, one numeric digit, and one special symbol."
#             )
#         return v
    
#     @model_validator(mode='after')
#     def validate_conditional_otps(self) -> 'OwnerRegisterRequest':
#         """
#         Cross-field validation: Ensures that if an email or mobile was provided, 
#         the corresponding OTP is also present.
#         """
#         if self.email and not self.email_otp:
#             raise ValueError("An Email OTP is required because an email address was provided.")
#         if self.mobile and not self.mobile_otp:
#             raise ValueError("A Mobile OTP is required because a mobile number was provided.")
#         return self
    

# # ==========================================
# # SECURE USER OUTPUT FILTER
# # ==========================================
# class UserResponse(UserBase):
#     id: UUID4 = Field(description="Immutable, cryptographically safe unique identifier.")
#     is_active: bool = Field(default=False, description="Indicates if the user profile is active or suspended.")
#     is_verified: bool = Field(default=False, description="Indicates if the user profile is verified.")
#     created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

#     # Expose the default workspace context to the frontend
#     default_lab_id: Optional[UUID4] = Field(
#         default=None, 
#         description="The UUID of the user's primary or last-accessed laboratory."
#     )
    
#     # Modern Pydantic V2 framework configuration
#     model_config = ConfigDict(from_attributes=True)


# # ==========================================
# # VERIFY LOGIN OTP SCHEMA
# # ==========================================
# class LoginWithOTPRequest(BaseModel):
#     """Schema for step 2 of Passwordless Login"""
#     mobile: str = Field(..., description="The user's mobile number.")
#     mobile_otp: str = Field(..., min_length=6, max_length=6, description="6-digit mobile OTP")
#     mobile_verification_token: str = Field(..., description="The JWT state token returned in Step 1")

#     @field_validator('mobile', mode='before')
#     @classmethod
#     def sanitize_and_format_mobile(cls, v: str) -> str:
#         if not isinstance(v, str):
#             raise ValueError("Mobile number must be a string")
#         sanitized = re.sub(r'[^\d+]', '', v)
#         if len(sanitized) == 10 and not sanitized.startswith('+'):
#             sanitized = f"+91{sanitized}"
#         elif len(sanitized) == 11 and sanitized.startswith('0'):
#             sanitized = f"+91{sanitized[1:]}"
#         return sanitized
    

# # ==========================================
# # STATELESS TOKEN ARCHITECTURE
# # ==========================================
# class TokenPayload(BaseModel):
#     """
#     Decrypted JWT inner payload structure. 
#     Kept lean to reduce token size and HTTP header bloat.
#     """
#     sub: str = Field(..., description="The User UUID string acting as the token subject.")
#     exp: int = Field(..., description="Token expiration Unix timestamp.")
#     email: EmailStr
#     mobile: str


# class Token(BaseModel):
#     """The immediate response schema delivered following successful login."""
#     access_token: str = Field(..., description="The cryptographically signed JWT bearer token string.")
#     token_type: str = Field(default="bearer", description="Explicit standard authorization transport token type.")
#     user: UserResponse = Field(..., description="The filtered user details profile to initialize client-side states.")