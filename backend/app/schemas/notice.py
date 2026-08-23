from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class NoticeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    content: str = Field(..., min_length=10, max_length=2000)
    is_important: bool = False

class NoticeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    content: Optional[str] = Field(None, min_length=10, max_length=2000)
    is_important: Optional[bool] = None

class NoticeResponse(BaseModel):
    id: UUID
    admin_id: UUID
    admin_name: Optional[str] = None
    title: str
    content: str
    is_important: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
