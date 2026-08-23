from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class SystemSettingsResponse(BaseModel):
    id: UUID
    overdue_threshold_days: int
    updated_at: datetime

    class Config:
        from_attributes = True

class SystemSettingsUpdate(BaseModel):
    overdue_threshold_days: int = Field(..., ge=1, le=365)
