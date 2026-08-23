from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.profile import Profile
from app.models.settings import SystemSettings
from app.schemas.settings import SystemSettingsResponse, SystemSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_SETTINGS_ID = "a0000000-0000-0000-0000-000000000001"

@router.get("", response_model=SystemSettingsResponse)
def get_settings(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current application settings.
    Available to all authenticated users (residents and admins).
    """
    settings_rec = db.query(SystemSettings).first()
    if not settings_rec:
        # Create default record
        settings_rec = SystemSettings(
            id=DEFAULT_SETTINGS_ID,
            overdue_threshold_days=7
        )
        db.add(settings_rec)
        db.commit()
        db.refresh(settings_rec)
    return settings_rec

@router.patch("", response_model=SystemSettingsResponse)
def update_settings(
    payload: SystemSettingsUpdate,
    current_user: Profile = Depends(get_current_admin), # Enforces admin authority
    db: Session = Depends(get_db)
):
    """
    Update system configurations. Restricted to Admins only.
    """
    settings_rec = db.query(SystemSettings).first()
    if not settings_rec:
        settings_rec = SystemSettings(
            id=DEFAULT_SETTINGS_ID,
            overdue_threshold_days=payload.overdue_threshold_days
        )
        db.add(settings_rec)
    else:
        settings_rec.overdue_threshold_days = payload.overdue_threshold_days
        settings_rec.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(settings_rec)
    return settings_rec
