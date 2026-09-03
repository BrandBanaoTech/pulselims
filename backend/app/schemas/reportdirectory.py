from pydantic import BaseModel, Field

class ReportTemplateResponse(BaseModel):
    primary_color: str = Field(default="#1e40af", example="#1e40af")
    secondary_color: str = Field(default="#4b5563", example="#4b5563")
    accent_color: str = Field(default="#059669", example="#059669")
    header_layout: str = Field(default="left-aligned", example="left-aligned")
    font_family: str = Field(default="Inter")

    class Config:
        from_attributes = True