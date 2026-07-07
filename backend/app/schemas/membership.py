from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, EmailStr, Field, UUID4, model_validator

# ==========================================
# MEMBERSHIP STATUS ENUMERATION
# ==========================================
class MembershipStatus(str, Enum):
    PENDING = "PENDING"       # OTP sent, waiting for user consent
    ACTIVE = "ACTIVE"         # OTP verified, user has full access
    SUSPENDED = "SUSPENDED"   # Temporarily disabled by lab owner

# ==========================================
# STEP 1: INITIATE STAFF ADDITION (Send OTP)
# ==========================================
class StaffAddInitiate(BaseModel):
    email: Optional[EmailStr] = Field(
        None, 
        description="The registered email address of the user."
    )
    mobile_number: Optional[str] = Field(
        None, 
        pattern=r'^\+?[1-9]\d{1,14}$',
        description="E.164 formatted mobile number (e.g., +919876543210)."
    )
    permissions: List[str] = Field(
        default=["read_only"], 
        description="List of permission scopes to grant upon successful OTP verification."
    )

    @model_validator(mode='after')
    def verify_contact_method(self) -> 'StaffAddInitiate':
        if not self.email and not self.mobile_number:
            raise ValueError("At least one contact method (email or mobile number) is required.")
        return self


# ==========================================
# STEP 2: VERIFY OTP & GRANT ACCESS
# ==========================================
class StaffAddVerify(BaseModel):
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    otp: str = Field(
        ..., 
        min_length=6, 
        max_length=6, 
        description="The 6-digit OTP provided by the staff member."
    )

    @model_validator(mode='after')
    def verify_contact_method(self) -> 'StaffAddVerify':
        if not self.email and not self.mobile_number:
            raise ValueError("Must provide the email or mobile number associated with the OTP.")
        return self


# ==========================================
# STAFF UPDATE VALIDATION
# ==========================================
class StaffUpdate(BaseModel):
    permissions: Optional[List[str]] = Field(
        None, 
        min_length=1, 
        description="The updated list of permissions."
    )
    status: Optional[MembershipStatus] = Field(
        None,
        description="Allows owners to suspend/reactivate a staff member."
    )


# ==========================================
# STAFF OUTBOUND VALIDATION (RESPONSES)
# ==========================================
class StaffResponse(BaseModel):
    id: UUID4 = Field(description="The immutable ID of the membership record.")
    user_id: UUID4 = Field(description="The UUID of the registered user.")
    lab_id: UUID4 = Field(description="The UUID of the laboratory.")
    permissions: List[str] = Field(description="The active array of access scopes.")
    
    # Exposing the strict Enum status to the frontend
    status: MembershipStatus = Field(description="Current access status of the staff member.")
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)