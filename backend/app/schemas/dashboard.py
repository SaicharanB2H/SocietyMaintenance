from pydantic import BaseModel
from typing import List

class DashboardSummary(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    overdue: int

class CategoryStat(BaseModel):
    category: str
    count: int

class StatusStat(BaseModel):
    status: str
    count: int

class TrendStat(BaseModel):
    date: str # Format: YYYY-MM-DD
    count: int
