import uuid
from enum import Enum as PyEnum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Uuid, JSON, Boolean, ForeignKey, UniqueConstraint, Index,
    Enum, Numeric, DateTime
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

# ==========================================
# 1. STRICT CLINICAL ENUMS (ABDM/NABL Mapped)
# ==========================================
class DepartmentEnum(str, PyEnum):
    HEMATOLOGY = "Hematology"
    CLINICAL_BIOCHEMISTRY = "Clinical Biochemistry"
    ENDOCRINOLOGY = "Endocrinology"
    IMMUNOLOGY_SEROLOGY = "Immunology & Serology"
    CLINICAL_PATHOLOGY = "Clinical Pathology"
    MICROBIOLOGY = "Microbiology"
    HISTOPATHOLOGY_CYTOLOGY = "Histopathology & Cytology"
    TUMOR_MARKERS = "Tumor Markers"

class SampleTypeEnum(str, PyEnum):
    WHOLE_BLOOD_EDTA = "Whole Blood (EDTA)"
    SERUM_SST = "Serum (SST)"
    PLASMA_FLUORIDE = "Plasma (Fluoride)"
    PLASMA_CITRATE = "Plasma (Citrate)"
    URINE_MID_STREAM = "Urine (Mid-stream)"
    URINE_24_HRS = "Urine (24 Hrs)"
    STOOL = "Stool"
    SPUTUM = "Sputum"
    SEMEN = "Semen"
    TISSUE_SWAB = "Tissue/Swab"
    BODY_FLUID = "Body Fluid"
    CSF = "CSF"


# ==========================================
# 2. MASTER CATALOG (Global Reference)
# ==========================================
class MasterCatalogTest(Base):
    __tablename__ = "master_catalog_tests"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    loinc_code = Column(String, unique=True, index=True, nullable=True)
    official_name = Column(String, nullable=False, index=True)
    
    department = Column(Enum(DepartmentEnum, native_enum=False), nullable=False)
    sample_type = Column(Enum(SampleTypeEnum, native_enum=False), nullable=False)
    
    default_tat = Column(String, default="24 Hrs")
    default_price = Column(Numeric(10, 2), default=0.00)
    pdf_result_fields = Column(JSON, default=list) 
    clinical_guidelines = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())