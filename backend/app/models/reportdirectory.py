from sqlalchemy import Column, Integer, String, JSON
from ..core.database import Base

class LabReportTemplate(Base):
    __tablename__ = "lab_report_templates"

    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(Integer, unique=True, index=True)
    
    # Design Tokens (Hex values)
    primary_color = Column(String, default="#1e40af")   # Deep Blue
    secondary_color = Column(String, default="#4b5563") # Slate Gray
    accent_color = Column(String, default="#059669")    # Medical Green
    
    # Layout Presets
    header_layout = Column(String, default="left-aligned") # 'left-aligned' | 'centered' | 'split'
    font_family = Column(String, default="Inter")
    
    # Additional optional custom CSS variables
    custom_styles = Column(JSON, nullable=True)