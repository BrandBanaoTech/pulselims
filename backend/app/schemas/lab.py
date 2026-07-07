from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, UUID4, field_validator

class Address(BaseModel):
    street_1: str = Field(..., max_length=255, description="Primary street address or building.")
    street_2: Optional[str] = Field(None, max_length=255, description="Suite, unit, or floor.")
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100, description="State, province, or region.")
    postal_code: str = Field(..., max_length=20, description="Zip or postal code.")
    country: str = Field(default="India", max_length=100)

    @field_validator('*', mode='before')
    @classmethod
    def strip_whitespace(cls, value):
        return value.strip() if isinstance(value, str) else value


class LabBase(BaseModel):
    name: str = Field(
        ..., 
        min_length=2, 
        max_length=255, 
        description="The legally registered name of the laboratory."
    )
    license_number: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Official medical license or accreditation number (e.g., NABL, CLIA). Required for valid report generation."
    )
    support_email: EmailStr = Field(
        ..., 
        description="Public-facing email address printed on patient reports."
    )
    contact_phone: str = Field(
        ..., 
        pattern=r'^\+?[1-9]\d{1,14}$', 
        description="E.164 formatted phone number for automated SMS and report footers.",
        examples=["+919876543210"]
    )
    timezone: str = Field(
        default="Asia/Kolkata", 
        description="IANA Timezone string. Crucial for accurate sample collection and verification timestamps."
    )

    # --- BRANDING & REPORT GENERATION FIELDS ---
    logo_url: Optional[HttpUrl] = Field(
        None, 
        description="URL to the lab's logo stored in cloud storage (e.g., AWS S3). Used in the report header."
    )
    website: Optional[HttpUrl] = Field(
        None, 
        description="Lab's official website, printed on report headers/footers."
    )
    report_header_text: Optional[str] = Field(
        None, 
        max_length=500, 
        description="Custom text to appear next to or below the logo (e.g., 'A Center of Excellence in Diagnostics')."
    )
    report_footer_text: Optional[str] = Field(
        None, 
        max_length=1000, 
        description="Standard legal disclaimer printed at the bottom of every page (e.g., 'This is a computer-generated report...')."
    )

    # --- LEGAL COMPLIANCE FIELDS ---
    director_name: Optional[str] = Field(
        None, 
        max_length=150, 
        description="Name of the Chief Medical Officer or Lab Director required on the report."
    )
    director_signature_url: Optional[HttpUrl] = Field(
        None, 
        description="URL to the digital signature image of the Lab Director."
    )


class LabCreate(LabBase):
    address: Address = Field(..., description="The physical location of the laboratory.")


class LabUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    license_number: Optional[str] = Field(None, max_length=100)
    support_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    timezone: Optional[str] = None
    address: Optional[Address] = None
    
    logo_url: Optional[HttpUrl] = None
    website: Optional[HttpUrl] = None
    report_header_text: Optional[str] = None
    report_footer_text: Optional[str] = None
    director_name: Optional[str] = None
    director_signature_url: Optional[HttpUrl] = None
    
    is_active: Optional[bool] = Field(None, description="Allows owners to temporarily suspend a lab location.")


class LabResponse(LabBase):
    id: UUID4 = Field(description="The immutable Lab Tenant ID.")
    owner_id: UUID4 = Field(description="The UUID of the User who holds master billing/admin rights.")
    address: Address
    is_active: bool = Field(description="If false, API access for this lab's staff is halted.")
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LabDeletionChallenge(BaseModel):
    lab_name_confirmation: str = Field(
        ..., 
        description="The exact name of the lab, typed by the user to confirm intent."
    )
    owner_password: str = Field(
        ..., 
        description="The owner's plain-text password to re-authenticate the destructive action."
    )