from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from ..models.testdictionary import DepartmentEnum, SampleTypeEnum

# ==========================================
# MASTER CATALOG SCHEMAS
# ==========================================
class MasterCatalogTestResponse(BaseModel):
    id: UUID
    loinc_code: Optional[str] = None
    official_name: str
    department: DepartmentEnum
    sample_type: SampleTypeEnum
    default_tat: str
    default_price: Decimal  # 💰 Upgraded to Decimal for financial precision
    pdf_result_fields: List[str]
    clinical_guidelines: Optional[str] = None
    
    # ⏱️ Exposed audit trails for frontend UI
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# LAB TEST SCHEMAS
# ==========================================
class LabTestCreate(BaseModel):
    master_test_id: Optional[UUID] = Field(None, description="Link to Master Catalog for ABDM compliance")
    code: str = Field(..., min_length=2, max_length=20, description="Local lab test code (e.g., LFT-01)")
    name: str = Field(..., min_length=2, max_length=150, description="Local display name")
    department: DepartmentEnum
    sample_type: SampleTypeEnum
    
    # 💰 Strict Decimal validation (prevents inputs like 10.555)
    price: Decimal = Field(..., ge=0, decimal_places=2) 
    
    tat: str = Field(..., min_length=1, description="Turnaround Time (e.g., '24 Hrs')")
    guidelines: Optional[str] = None
    is_active: bool = True

    @field_validator('code')
    @classmethod
    def sanitize_code(cls, v: str) -> str:
        """Forces billing codes to be UPPERCASE and removes internal spaces."""
        return v.strip().upper().replace(" ", "-")


class LabTestUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    tat: Optional[str] = Field(None, min_length=1)
    guidelines: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('code')
    @classmethod
    def sanitize_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().upper().replace(" ", "-")
        return v


class LabTestResponse(BaseModel):
    id: UUID
    lab_id: UUID
    master_test_id: Optional[UUID] = None
    loinc_code: Optional[str] = Field(default=None, description="Resolved from Master Catalog")
    code: str
    name: str
    department: DepartmentEnum
    sample_type: SampleTypeEnum
    price: Decimal
    tat: str
    guidelines: Optional[str] = None
    is_active: bool

    pdf_result_fields: List[str] = Field(default_factory=list, description="Resolved from Master Catalog")
    
    # ⏱️ Exposed audit trails for frontend UI
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True # Globally strips trailing spaces on string responses
    )