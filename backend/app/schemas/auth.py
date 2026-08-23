from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional

class ProfileResponse(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    email: EmailStr
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
