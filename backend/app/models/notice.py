import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, func, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notice(Base):
    __tablename__ = "notices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    is_important = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    admin = relationship("Profile", back_populates="notices")
