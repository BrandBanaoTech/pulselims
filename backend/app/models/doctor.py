import uuid

from sqlalchemy import (
    Column, String, Uuid, ForeignKey
)

from ..core.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)

    #----------------------------------------------------------
    # TENANT, LAB LINK
    #----------------------------------------------------------
    lab_id = Column(Uuid(as_uuid=True), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(150), nullable=False)
