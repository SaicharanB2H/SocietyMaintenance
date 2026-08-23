import uuid
from sqlalchemy import Column, Integer, DateTime, func, UUID
from app.core.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    overdue_threshold_days = Column(Integer, default=7, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
