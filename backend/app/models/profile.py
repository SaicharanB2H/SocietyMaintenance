from sqlalchemy import Column, String, DateTime, func, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True) # Maps to Supabase auth.users.id
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="resident", nullable=False) # 'resident' or 'admin'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    complaints = relationship("Complaint", back_populates="resident", cascade="all, delete-orphan", foreign_keys="[Complaint.resident_id]")
    notices = relationship("Notice", back_populates="admin", cascade="all, delete-orphan")
    actions_taken = relationship("ComplaintHistory", back_populates="actor")
