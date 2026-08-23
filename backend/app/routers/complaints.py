import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import case, or_
from app.core.database import get_db
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.profile import Profile
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.services.storage_service import StorageService
from app.services.complaint_service import ComplaintService
from app.services.email_service import EmailService
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintPaginationResponse,
    ComplaintHistoryResponse,
    ComplaintPriorityUpdate,
    ComplaintStatusUpdate
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])

ALLOWED_CATEGORIES = {
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Security",
    "Lift",
    "Water Supply",
    "Parking",
    "Maintenance",
    "Other"
}

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    category: str = Form(...),
    description: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a new complaint. Residents can optionally upload a photo.
    Validates the category, description length, and image format/size.
    """
    # 1. Validation
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Allowed values: {', '.join(ALLOWED_CATEGORIES)}"
        )
    
    clean_description = description.strip()
    if not clean_description or len(clean_description) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description is required and must be at least 10 characters long."
        )
        
    if len(clean_description) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot exceed 1000 characters."
        )

    # 2. Upload photo if provided
    photo_url = None
    if photo and photo.filename:
        photo_url = StorageService.upload_photo(photo)

    # 3. Create database records in a transaction
    complaint = ComplaintService.create_complaint(
        db=db,
        resident_id=current_user.id,
        category=category,
        description=clean_description,
        photo_url=photo_url
    )
    
    # Return response serialized as Profile name loaded
    return ComplaintResponse(
        id=complaint.id,
        resident_id=complaint.resident_id,
        resident_name=current_user.full_name,
        category=complaint.category,
        description=complaint.description,
        photo_url=complaint.photo_url,
        status=complaint.status,
        priority=complaint.priority,
        is_overdue=complaint.is_overdue,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        resolved_at=complaint.resolved_at
    )

@router.get("", response_model=ComplaintPaginationResponse)
def list_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    overdue_only: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("overdue"), # 'newest', 'oldest', 'priority', 'overdue'
    date_start: Optional[datetime] = Query(None),
    date_end: Optional[datetime] = Query(None),
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List complaints. Admins see all complaints with filters/sorting/search.
    Residents only see their own complaints, sorted by newest.
    """
    # Base query joining profiles so we can access resident name
    query = db.query(Complaint).join(Profile, Complaint.resident_id == Profile.id)

    # Security check: residents can only see their own complaints
    if current_user.role != "admin":
        query = query.filter(Complaint.resident_id == current_user.id)
        # Force sort by newest for residents
        query = query.order_by(Complaint.created_at.desc())
    else:
        # Admin can filter
        if category:
            query = query.filter(Complaint.category == category)
        if status:
            query = query.filter(Complaint.status == status)
        if priority:
            query = query.filter(Complaint.priority == priority)
        if overdue_only:
            query = query.filter(Complaint.is_overdue == True)
        if date_start:
            query = query.filter(Complaint.created_at >= date_start)
        if date_end:
            query = query.filter(Complaint.created_at <= date_end)
        
        if search:
            search_term = f"%{search.strip()}%"
            # Try to check if search is a UUID
            uuid_filter = None
            try:
                search_uuid = uuid.UUID(search.strip())
                uuid_filter = (Complaint.id == search_uuid)
            except ValueError:
                pass
            
            if uuid_filter is not None:
                query = query.filter(
                    or_(
                        uuid_filter,
                        Complaint.description.ilike(search_term),
                        Profile.full_name.ilike(search_term)
                    )
                )
            else:
                query = query.filter(
                    or_(
                        Complaint.description.ilike(search_term),
                        Profile.full_name.ilike(search_term)
                    )
                )

        # Build sorting
        priority_order = case(
            (Complaint.priority == "High", 1),
            (Complaint.priority == "Medium", 2),
            (Complaint.priority == "Low", 3),
            else_=4
        )

        if sort_by == "newest":
            query = query.order_by(Complaint.created_at.desc())
        elif sort_by == "oldest":
            query = query.order_by(Complaint.created_at.asc())
        elif sort_by == "priority":
            query = query.order_by(priority_order.asc(), Complaint.created_at.desc())
        elif sort_by == "overdue":
            # Overdue complaints naturally appear at the top, then newest
            query = query.order_by(Complaint.is_overdue.desc(), Complaint.created_at.desc())
        else:
            query = query.order_by(Complaint.created_at.desc())

    # Dynamically evaluate overdue status for all listed complaints to guarantee up-to-date values
    # For pagination efficiency, we fetch item count first
    total = query.count()
    offset = (page - 1) * limit
    db_items = query.offset(offset).limit(limit).all()

    # Verify and update overdue flag dynamically
    items = []
    for item in db_items:
        ComplaintService.check_and_update_overdue(db, item)
        items.append(
            ComplaintResponse(
                id=item.id,
                resident_id=item.resident_id,
                resident_name=item.resident.full_name,
                category=item.category,
                description=item.description,
                photo_url=item.photo_url,
                status=item.status,
                priority=item.priority,
                is_overdue=item.is_overdue,
                created_at=item.created_at,
                updated_at=item.updated_at,
                resolved_at=item.resolved_at
            )
        )

    pages = (total + limit - 1) // limit

    return ComplaintPaginationResponse(
        items=items,
        page=page,
        limit=limit,
        total=total,
        pages=pages
    )

@router.get("/{id}", response_model=ComplaintDetailResponse)
def get_complaint_details(
    id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed view of a complaint, including its complete history timeline.
    Residents can only see their own complaints.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    # Security: Resident cannot view other resident's complaint
    if current_user.role != "admin" and complaint.resident_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this complaint."
        )

    # Evaluate overdue status dynamically
    ComplaintService.check_and_update_overdue(db, complaint)

    # Fetch history entries sorted chronologically
    history_entries = db.query(ComplaintHistory)\
        .filter(ComplaintHistory.complaint_id == complaint.id)\
        .order_by(ComplaintHistory.created_at.asc())\
        .all()

    # Map history to schema including actor name
    history_list = []
    for h in history_entries:
        actor_name = "System"
        if h.actor:
            actor_name = h.actor.full_name
        history_list.append(
            ComplaintHistoryResponse(
                id=h.id,
                complaint_id=h.complaint_id,
                actor_id=h.actor_id,
                actor_name=actor_name,
                old_status=h.old_status,
                new_status=h.new_status,
                note=h.note,
                created_at=h.created_at
            )
        )

    return ComplaintDetailResponse(
        id=complaint.id,
        resident_id=complaint.resident_id,
        resident_name=complaint.resident.full_name,
        category=complaint.category,
        description=complaint.description,
        photo_url=complaint.photo_url,
        status=complaint.status,
        priority=complaint.priority,
        is_overdue=complaint.is_overdue,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        resolved_at=complaint.resolved_at,
        history=history_list
    )

@router.patch("/{id}/priority", response_model=ComplaintResponse)
def update_complaint_priority(
    id: uuid.UUID,
    payload: ComplaintPriorityUpdate,
    current_user: Profile = Depends(get_current_admin), # Enforces admin authority
    db: Session = Depends(get_db)
):
    """
    Update complaint priority. Only available to Admins.
    Does not log a status transition history.
    """
    complaint = ComplaintService.update_priority(db, id, payload.priority)
    return ComplaintResponse(
        id=complaint.id,
        resident_id=complaint.resident_id,
        resident_name=complaint.resident.full_name,
        category=complaint.category,
        description=complaint.description,
        photo_url=complaint.photo_url,
        status=complaint.status,
        priority=complaint.priority,
        is_overdue=complaint.is_overdue,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        resolved_at=complaint.resolved_at
    )

@router.patch("/{id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    id: uuid.UUID,
    payload: ComplaintStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: Profile = Depends(get_current_admin), # Enforces admin authority
    db: Session = Depends(get_db)
):
    """
    Update complaint status. Only available to Admins.
    Validates status transition, inserts history log, and sends email to the resident.
    """
    complaint, old_status = ComplaintService.update_status(
        db=db,
        complaint_id=id,
        actor=current_user,
        new_status=payload.status,
        note=payload.note
    )

    # Queue email sending in the background so it doesn't slow down or fail the transaction
    resident_email = complaint.resident.email
    if resident_email:
        background_tasks.add_task(
            EmailService.send_status_update_email,
            recipient_email=resident_email,
            complaint_id=str(complaint.id),
            category=complaint.category,
            old_status=old_status,
            new_status=complaint.status,
            note=payload.note
        )

    return ComplaintResponse(
        id=complaint.id,
        resident_id=complaint.resident_id,
        resident_name=complaint.resident.full_name,
        category=complaint.category,
        description=complaint.description,
        photo_url=complaint.photo_url,
        status=complaint.status,
        priority=complaint.priority,
        is_overdue=complaint.is_overdue,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        resolved_at=complaint.resolved_at
    )

@router.get("/{id}/history", response_model=List[ComplaintHistoryResponse])
def get_complaint_history(
    id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve full historical updates log of a specific complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
        
    if current_user.role != "admin" and complaint.resident_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this complaint."
        )

    history_entries = db.query(ComplaintHistory)\
        .filter(ComplaintHistory.complaint_id == id)\
        .order_by(ComplaintHistory.created_at.asc())\
        .all()

    history_list = []
    for h in history_entries:
        actor_name = "System"
        if h.actor:
            actor_name = h.actor.full_name
        history_list.append(
            ComplaintHistoryResponse(
                id=h.id,
                complaint_id=h.complaint_id,
                actor_id=h.actor_id,
                actor_name=actor_name,
                old_status=h.old_status,
                new_status=h.new_status,
                note=h.note,
                created_at=h.created_at
            )
        )
    return history_list
