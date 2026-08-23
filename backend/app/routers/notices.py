import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.profile import Profile
from app.models.notice import Notice
from app.schemas.notice import NoticeResponse, NoticeCreate, NoticeUpdate
from app.services.email_service import EmailService

router = APIRouter(prefix="/notices", tags=["Notice Board"])

@router.get("", response_model=List[NoticeResponse])
def list_notices(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all notices. Pinned (important) notices are returned first,
    followed by normal notices ordered by creation date (newest first).
    """
    # Join with profiles to get admin names
    db_notices = db.query(Notice)\
        .join(Profile, Notice.admin_id == Profile.id)\
        .order_by(Notice.is_important.desc(), Notice.created_at.desc())\
        .all()

    return [
        NoticeResponse(
            id=n.id,
            admin_id=n.admin_id,
            admin_name=n.admin.full_name,
            title=n.title,
            content=n.content,
            is_important=n.is_important,
            created_at=n.created_at,
            updated_at=n.updated_at
        )
        for n in db_notices
    ]

@router.post("", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(
    payload: NoticeCreate,
    background_tasks: BackgroundTasks,
    current_user: Profile = Depends(get_current_admin), # Enforces admin authority
    db: Session = Depends(get_db)
):
    """
    Create a new notice. Pinned notices send email updates to all residents.
    """
    notice = Notice(
        admin_id=current_user.id,
        title=payload.title,
        content=payload.content,
        is_important=payload.is_important
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # If it is marked as important, broadcast email to all residents
    if notice.is_important:
        residents = db.query(Profile).filter(Profile.role == "resident").all()
        resident_emails = [r.email for r in residents if r.email]
        if resident_emails:
            background_tasks.add_task(
                EmailService.send_important_notice_email,
                recipient_emails=resident_emails,
                notice_title=notice.title,
                notice_content=notice.content
            )

    return NoticeResponse(
        id=notice.id,
        admin_id=notice.admin_id,
        admin_name=current_user.full_name,
        title=notice.title,
        content=notice.content,
        is_important=notice.is_important,
        created_at=notice.created_at,
        updated_at=notice.updated_at
    )

@router.patch("/{id}", response_model=NoticeResponse)
def update_notice(
    id: uuid.UUID,
    payload: NoticeUpdate,
    background_tasks: BackgroundTasks,
    current_user: Profile = Depends(get_current_admin), # Enforces admin authority
    db: Session = Depends(get_db)
):
    """
    Modify an existing notice.
    """
    notice = db.query(Notice).filter(Notice.id == id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found"
        )

    was_important = notice.is_important

    if payload.title is not None:
        notice.title = payload.title
    if payload.content is not None:
        notice.content = payload.content
    if payload.is_important is not None:
        notice.is_important = payload.is_important
        
    notice.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(notice)

    # If status transitioned from normal to important, send email notification
    if notice.is_important and not was_important:
        residents = db.query(Profile).filter(Profile.role == "resident").all()
        resident_emails = [r.email for r in residents if r.email]
        if resident_emails:
            background_tasks.add_task(
                EmailService.send_important_notice_email,
                recipient_emails=resident_emails,
                notice_title=notice.title,
                notice_content=notice.content
            )

    return NoticeResponse(
        id=notice.id,
        admin_id=notice.admin_id,
        admin_name=notice.admin.full_name,
        title=notice.title,
        content=notice.content,
        is_important=notice.is_important,
        created_at=notice.created_at,
        updated_at=notice.updated_at
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(
    id: uuid.UUID,
    current_user: Profile = Depends(get_current_admin), # Enforces admin authority
    db: Session = Depends(get_db)
):
    """
    Remove a notice from the Notice Board.
    """
    notice = db.query(Notice).filter(Notice.id == id).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found"
        )
    db.delete(notice)
    db.commit()
    return
