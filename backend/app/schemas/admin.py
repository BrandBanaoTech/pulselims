from pydantic import BaseModel, Field
from typing import Dict, Any

class SystemMetricsResponse(BaseModel):
    total_labs: int
    active_labs: int
    total_users: int
    total_master_tests: int
    # You can add revenue, API usage, etc., later
    system_health: str = Field(default="Operational")

class MasterCatalogTestCreate(BaseModel):
    # Matches your existing test dictionary fields
    loinc_code: str | None = None
    official_name: str = Field(..., min_length=2)
    department: str
    sample_type: str
    default_tat: str = "24 Hrs"
    default_price: float = Field(..., ge=0)
    pdf_result_fields: list[str] = []
    clinical_guidelines: str | None = None