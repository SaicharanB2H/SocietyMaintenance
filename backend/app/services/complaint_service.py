from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.profile import Profile
from app.models.settings import SystemSettings
import uuid

VALID_TRANSITIONS = {
    "Open": {"In Progress", "Resolved"},
    "In Progress": {"Resolved"},
    "Resolved": set() # Terminal state
}

class ComplaintService:
    @staticmethod
    def create_complaint(
        db: Session,
        resident_id: uuid.UUID,
        category: str,
        description: str,
        photo_url: str = None
    ) -> Complaint:
        """
        Creates a new complaint and logs the initial 'Open' state in the history.
        Executed within a single database transaction.
        """
        # 1. Create the Complaint
        complaint = Complaint(
            resident_id=resident_id,
            category=category,
            description=description,
            photo_url=photo_url,
            status="Open",
            priority="Low",
            is_overdue=False
        )
        db.add(complaint)
        db.flush() # Flush to populate complaint.id

        # 2. Add history record
        history_entry = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=resident_id,
            old_status=None,
            new_status="Open",
            note="Complaint registered successfully."
        )
        db.add(history_entry)
        db.commit()
        db.refresh(complaint)
        return complaint

    @staticmethod
    def update_status(
        db: Session,
        complaint_id: uuid.UUID,
        actor: Profile,
        new_status: str,
        note: str = None
    ) -> tuple[Complaint, str]:
        """
        Updates the status of a complaint after validating the transition.
        Writes to complaint_history. Returns the updated complaint and the old status.
        Executed transaction-safely.
        """
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).with_for_update().first()
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )

        old_status = complaint.status

        if old_status == new_status:
            return complaint, old_status

        # Validate transition
        allowed = VALID_TRANSITIONS.get(old_status, set())
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{old_status}' to '{new_status}'."
            )

        # Update complaint fields
        complaint.status = new_status
        complaint.updated_at = datetime.utcnow()
        
        if new_status == "Resolved":
            complaint.resolved_at = datetime.utcnow()
            complaint.is_overdue = False # Resolved complaints can never be overdue

        # Create history entry
        history_entry = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=actor.id,
            old_status=old_status,
            new_status=new_status,
            note=note
        )

        db.add(history_entry)
        db.commit()
        db.refresh(complaint)
        return complaint, old_status

    @staticmethod
    def update_priority(
        db: Session,
        complaint_id: uuid.UUID,
        new_priority: str
    ) -> Complaint:
        """
        Updates the priority level of a complaint. Does not log history.
        """
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )

        complaint.priority = new_priority
        complaint.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(complaint)
        return complaint

    @staticmethod
    def check_and_update_overdue(db: Session, complaint: Complaint) -> bool:
        """
        Checks if a complaint is overdue and updates its is_overdue column.
        Returns True if overdue, False otherwise.
        """
        if complaint.status == "Resolved":
            if complaint.is_overdue:
                complaint.is_overdue = False
                db.commit()
            return False

        # Get threshold setting
        settings_rec = db.query(SystemSettings).first()
        threshold_days = settings_rec.overdue_threshold_days if settings_rec else 7

        delta = datetime.utcnow() - complaint.created_at.replace(tzinfo=None)
        is_now_overdue = delta.days >= threshold_days

        if complaint.is_overdue != is_now_overdue:
            complaint.is_overdue = is_now_overdue
            db.commit()
            
        return is_now_overdue
