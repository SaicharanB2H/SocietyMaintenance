from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List

# Priority and Status Allowed Values
class ComplaintPriorityUpdate(BaseModel):
    priority: str = Field(..., pattern="^(Low|Medium|High)$")

class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Open|In Progress|Resolved)$")
    note: Optional[str] = None

class ComplaintHistoryResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    actor_id: Optional[UUID] = None
    actor_name: Optional[str] = None
    old_status: Optional[str] = None
    new_status: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: UUID
    resident_id: UUID
    resident_name: Optional[str] = None
    category: str
    description: str
    photo_url: Optional[str] = None
    status: str
    priority: str
    is_overdue: bool
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    history: List[ComplaintHistoryResponse] = []

class ComplaintPaginationResponse(BaseModel):
    items: List[ComplaintResponse]
    page: int
    limit: int
    total: int
    pages: int
