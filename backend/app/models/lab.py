import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, JSON, Uuid, Enum, Numeric
# from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
from .testdictionary import DepartmentEnum, SampleTypeEnum

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    license_number = Column(String(100), nullable=True)
    support_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    timezone = Column(String(50), nullable=False, default="Asia/Kolkata")
    address = Column(JSON, nullable=False)
    
    # --- BRANDING & REPORT GENERATION FIELDS ---
    logo_url = Column(String(1024), nullable=True)
    website = Column(String(255), nullable=True)
    report_header_text = Column(String(500), nullable=True)
    report_footer_text = Column(Text, nullable=True)
    
    # --- LEGAL COMPLIANCE FIELDS ---
    director_name = Column(String(150), nullable=True)
    director_signature_url = Column(String(1024), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    owner_id = Column(
        Uuid(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT", use_alter=True, name="fk_lab_owner_id"), 
        unique=True, 
        nullable=False,
        index=True
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # ==========================================
    # RELATIONSHIPS
    # ==========================================
    # Because we separated the files, SQLAlchemy uses the string "LabMembership" 
    # to find the model without needing to import it at the top, preventing circular imports!
    owner = relationship("User", back_populates="owned_labs", foreign_keys=[owner_id])
    staff = relationship("LabMembership", back_populates="lab", cascade="all, delete-orphan")
    tests = relationship("LabTest", back_populates="lab", cascade="all, delete-orphan")


# ==========================================
# 3. LOCAL LAB DICTIONARY (Tenant-Scoped)
# ==========================================
class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    lab_id = Column(Uuid(as_uuid=True), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    master_test_id = Column(Uuid(as_uuid=True), ForeignKey("master_catalog_tests.id", ondelete="RESTRICT"), nullable=True)
    
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    department = Column(Enum(DepartmentEnum, native_enum=False), nullable=False)
    sample_type = Column(Enum(SampleTypeEnum, native_enum=False), nullable=False)
    
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    tat = Column(String, nullable=False, default="24 Hrs")
    guidelines = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('lab_id', 'code', name='uix_lab_id_test_code'),
    )

    # Relationships
    master_test = relationship("MasterCatalogTest")
    
    # Optional: Add relationship back to the Lab model for easier ORM traversal
    lab = relationship("Lab", back_populates="tests")

    @property
    def loinc_code(self):
        return self.master_test.loinc_code if self.master_test else None

    @property
    def pdf_result_fields(self):
        return self.master_test.pdf_result_fields if self.master_test else []