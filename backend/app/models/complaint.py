import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, func, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resident_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    status = Column(String, default="Open", nullable=False) # 'Open', 'In Progress', 'Resolved'
    priority = Column(String, default="Low", nullable=False) # 'Low', 'Medium', 'High'
    is_overdue = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    resident = relationship("Profile", back_populates="complaints", foreign_keys=[resident_id])
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan")
