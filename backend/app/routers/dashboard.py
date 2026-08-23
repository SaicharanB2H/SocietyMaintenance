from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.profile import Profile
from app.models.complaint import Complaint
from app.models.settings import SystemSettings
from app.schemas.dashboard import DashboardSummary, CategoryStat, StatusStat, TrendStat

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_cutoff_date(db: Session) -> datetime:
    """Helper to retrieve cutoff date for overdue complaints."""
    settings_rec = db.query(SystemSettings).first()
    threshold_days = settings_rec.overdue_threshold_days if settings_rec else 7
    return datetime.utcnow() - timedelta(days=threshold_days)

@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard numeric counts summary.
    If Admin, returns global metrics.
    If Resident, returns resident-specific metrics.
    """
    # Base queries
    query = db.query(Complaint)
    if current_user.role != "admin":
        query = query.filter(Complaint.resident_id == current_user.id)

    total = query.count()
    open_count = query.filter(Complaint.status == "Open").count()
    in_progress = query.filter(Complaint.status == "In Progress").count()
    resolved = query.filter(Complaint.status == "Resolved").count()

    # Overdue is dynamically computed
    cutoff = get_cutoff_date(db)
    overdue = query.filter(
        Complaint.status.in_(["Open", "In Progress"]),
        Complaint.created_at <= cutoff
    ).count()

    return DashboardSummary(
        total=total,
        open=open_count,
        in_progress=in_progress,
        resolved=resolved,
        overdue=overdue
    )

@router.get("/status", response_model=List[StatusStat])
def get_status_breakdown(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complaint counts grouped by status.
    """
    query = db.query(
        Complaint.status.label("status"),
        func.count(Complaint.id).label("count")
    )
    if current_user.role != "admin":
        query = query.filter(Complaint.resident_id == current_user.id)
        
    results = query.group_by(Complaint.status).all()
    return [StatusStat(status=r.status, count=r.count) for r in results]

@router.get("/categories", response_model=List[CategoryStat])
def get_category_breakdown(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complaint counts grouped by category.
    """
    query = db.query(
        Complaint.category.label("category"),
        func.count(Complaint.id).label("count")
    )
    if current_user.role != "admin":
        query = query.filter(Complaint.resident_id == current_user.id)
        
    results = query.group_by(Complaint.category).all()
    return [CategoryStat(category=r.category, count=r.count) for r in results]

@router.get("/trends", response_model=List[TrendStat])
def get_trends(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complaint count trends over the last 30 days.
    """
    start_date = datetime.utcnow() - timedelta(days=30)
    
    # Cast created_at to Date for grouping
    query = db.query(
        func.date(Complaint.created_at).label("date"),
        func.count(Complaint.id).label("count")
    ).filter(Complaint.created_at >= start_date)

    if current_user.role != "admin":
        query = query.filter(Complaint.resident_id == current_user.id)

    results = query.group_by(func.date(Complaint.created_at))\
                   .order_by(func.date(Complaint.created_at).asc())\
                   .all()

    # Pre-populate all last 30 days with 0 counts to prevent chart gaps
    trend_dict = {}
    for i in range(30):
        d = (datetime.utcnow() - timedelta(days=i)).date()
        trend_dict[str(d)] = 0

    for r in results:
        # r.date might be returned as date object or string depending on dialect
        date_str = str(r.date)
        if date_str in trend_dict:
            trend_dict[date_str] = r.count
        else:
            trend_dict[date_str] = r.count

    # Sort items chronologically
    sorted_trends = sorted(trend_dict.items())
    return [TrendStat(date=k, count=v) for k, v in sorted_trends]
