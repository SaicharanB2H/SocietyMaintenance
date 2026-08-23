import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    complaint = relationship("Complaint", back_populates="history")
    actor = relationship("Profile", back_populates="actions_taken")
