import os
import sys
import uuid
import requests
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path so we can import our models
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.config import settings
from app.models.profile import Profile
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.notice import Notice
from app.models.settings import SystemSettings

# Load database engine
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("Connected to database successfully.")

# Mock emails & names
ADMIN_USER = {"email": "admin@society.com", "name": "Chief Admin", "role": "admin"}
RESIDENT_USERS = [
    {"email": "john@society.com", "name": "John Doe", "role": "resident"},
    {"email": "jane@society.com", "name": "Jane Smith", "role": "resident"},
    {"email": "robert@society.com", "name": "Robert Johnson", "role": "resident"},
    {"email": "emily@society.com", "name": "Emily Davis", "role": "resident"},
    {"email": "michael@society.com", "name": "Michael Wilson", "role": "resident"}
]

# Helper to create user via Supabase Admin API
def create_supabase_user(email, password, full_name):
    if not settings.SUPABASE_SERVICE_ROLE_KEY or not settings.SUPABASE_URL:
        print(f"Skipping Supabase Auth API for {email} (no credentials).")
        return None
        
    url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"full_name": full_name}
    }
    try:
        response = requests.post(url, json=body, headers=headers, timeout=10)
        if response.status_code in [200, 201]:
            print(f"Supabase Auth user created: {email}")
            return response.json().get("id")
        elif response.status_code == 400 and "already registered" in response.text:
            # User exists, try to get their ID
            print(f"User {email} already registered in Supabase. Retrieving profile.")
            return None
        else:
            print(f"Supabase Auth API failed for {email}: {response.text}")
            return None
    except Exception as e:
        print(f"Supabase Auth API error for {email}: {str(e)}")
        return None

def seed():
    # Clear existing notices, history, complaints, and profiles
    print("Clearing existing data...")
    db.query(Notice).delete()
    db.query(ComplaintHistory).delete()
    db.query(Complaint).delete()
    db.query(Profile).delete()
    db.commit()

    users_map = {} # Maps email -> Profile ID

    # Create admin
    admin_id_str = create_supabase_user(ADMIN_USER["email"], "password123", ADMIN_USER["name"])
    admin_id = uuid.UUID(admin_id_str) if admin_id_str else uuid.uuid4()
    
    admin_profile = Profile(
        id=admin_id,
        email=ADMIN_USER["email"],
        full_name=ADMIN_USER["name"],
        role="admin"
    )
    db.add(admin_profile)
    users_map[ADMIN_USER["email"]] = admin_id
    print(f"Created admin profile: {ADMIN_USER['name']}")

    # Create residents
    for u in RESIDENT_USERS:
        res_id_str = create_supabase_user(u["email"], "password123", u["name"])
        res_id = uuid.UUID(res_id_str) if res_id_str else uuid.uuid4()
        
        profile = Profile(
            id=res_id,
            email=u["email"],
            full_name=u["name"],
            role="resident"
        )
        db.add(profile)
        users_map[u["email"]] = res_id
        print(f"Created resident profile: {u['name']}")

    db.commit()

    # If some profiles were synced by triggers during the Supabase API signup,
    # update the admin role in the profiles table to "admin"
    admin_prof_in_db = db.query(Profile).filter(Profile.email == ADMIN_USER["email"]).first()
    if admin_prof_in_db:
        admin_prof_in_db.role = "admin"
        db.commit()
        admin_id = admin_prof_in_db.id

    # Create notices
    print("Seeding notices...")
    notices_data = [
        {"title": "Water Supply Shutdown Tomorrow", "content": "Dear Residents, there will be a scheduled water supply shutdown on August 22 from 10 AM to 1 PM for water tank cleaning. Please store sufficient water in advance.", "is_important": True},
        {"title": "Lift Maintenance in Wing B", "content": "Vator Elevators will perform monthly lift maintenance on Wing B elevator this Sunday between 9 AM and 12 PM. Kindly use the service lift.", "is_important": False},
        {"title": "Annual Society Meeting Agenda", "content": "Notice is hereby given for the Annual General Body Meeting scheduled for Sunday, August 30 at 4 PM in the clubhouse. Agenda will be sent separately.", "is_important": True},
        {"title": "Clubhouse Booking Policy Update", "content": "Members are requested to note that clubhouse booking charges have been updated. Please consult the administrative office for rates and slots booking.", "is_important": False},
        {"title": "New Security Access Cards", "content": "RFID access cards for cars will be distributed starting Monday. Please submit vehicle registration copies to the management office to collect cards.", "is_important": False}
    ]

    for nd in notices_data:
        notice = Notice(
            admin_id=admin_id,
            title=nd["title"],
            content=nd["content"],
            is_important=nd["is_important"]
        )
        db.add(notice)
    db.commit()

    # Create complaints, history logs
    print("Seeding complaints...")
    complaints_data = [
        # Plumbing
        {"email": "john@society.com", "category": "Plumbing", "description": "Continuous water leakage near the kitchen sink pipe. Need plumber assistance quickly.", "status": "In Progress", "priority": "High", "days_ago": 8, "note": "Plumber scheduled for dispatch."},
        {"email": "john@society.com", "category": "Plumbing", "description": "Bathroom flush tank is leaking water continuously, causing dampness.", "status": "Resolved", "priority": "Medium", "days_ago": 15, "note": "Flushing mechanism replaced and checked.", "resolved_days_ago": 12},
        # Electrical
        {"email": "jane@society.com", "category": "Electrical", "description": "Common corridor ceiling light on the 4th floor Wing A is flickering and burnt out.", "status": "Open", "priority": "Low", "days_ago": 2},
        {"email": "jane@society.com", "category": "Electrical", "description": "Main circuit breaker in my flat tripped twice today. Needs inspection.", "status": "In Progress", "priority": "High", "days_ago": 5, "note": "Electrician inspection completed, ordering replacement switchboard."},
        # Water Supply
        {"email": "robert@society.com", "category": "Water Supply", "description": "Low water pressure in all taps inside my flat. Kindly check terrace valves.", "status": "Open", "priority": "Medium", "days_ago": 9}, # Overdue
        {"email": "robert@society.com", "category": "Water Supply", "description": "Muddy water coming out of the bathroom taps since this morning.", "status": "Resolved", "priority": "High", "days_ago": 4, "note": "Main line filter cleaned and pipes flushed.", "resolved_days_ago": 3},
        # Lift
        {"email": "emily@society.com", "category": "Lift", "description": "Lift is making squeaking noises while moving between 3rd and 5th floors.", "status": "In Progress", "priority": "Medium", "days_ago": 6, "note": "Lift technician lubricated rails, observing performance."},
        # Cleaning
        {"email": "emily@society.com", "category": "Cleaning", "description": "Garbage collection box outside the lobby is overflowing and smelling bad.", "status": "Resolved", "priority": "Low", "days_ago": 3, "note": "Sweeper cleaned lobby and trash boxes cleared.", "resolved_days_ago": 2},
        # Parking
        {"email": "michael@society.com", "category": "Parking", "description": "Unregistered sedan is parked in my assigned parking slot #42. Please check.", "status": "Open", "priority": "Medium", "days_ago": 1},
        # Security
        {"email": "michael@society.com", "category": "Security", "description": "Intercom phone not working, unable to speak with gate security guard.", "status": "Open", "priority": "High", "days_ago": 11} # Overdue
    ]

    for cd in complaints_data:
        res_user_id = users_map.get(cd["email"])
        if not res_user_id:
            # Fallback if profile exists from db query
            db_res = db.query(Profile).filter(Profile.email == cd["email"]).first()
            res_user_id = db_res.id if db_res else admin_id

        created_time = datetime.utcnow() - timedelta(days=cd["days_ago"])
        resolved_time = None
        if cd["status"] == "Resolved" and "resolved_days_ago" in cd:
            resolved_time = datetime.utcnow() - timedelta(days=cd["resolved_days_ago"])

        # Check overdue dynamically
        is_overdue = False
        if cd["status"] in ["Open", "In Progress"] and cd["days_ago"] >= 7:
            is_overdue = True

        complaint = Complaint(
            resident_id=res_user_id,
            category=cd["category"],
            description=cd["description"],
            status=cd["status"],
            priority=cd["priority"],
            is_overdue=is_overdue,
            created_at=created_time,
            updated_at=resolved_time or created_time,
            resolved_at=resolved_time
        )
        db.add(complaint)
        db.flush()

        # Seed timeline history records
        # 1. Open event (always created when submitted)
        hist_open = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=res_user_id,
            old_status=None,
            new_status="Open",
            note="Complaint registered.",
            created_at=created_time
        )
        db.add(hist_open)

        # 2. In Progress event (if applicable)
        if cd["status"] in ["In Progress", "Resolved"]:
            in_progress_time = created_time + timedelta(hours=12)
            hist_progress = ComplaintHistory(
                complaint_id=complaint.id,
                actor_id=admin_id,
                old_status="Open",
                new_status="In Progress",
                note=cd.get("note", "Assigned team."),
                created_at=in_progress_time
            )
            db.add(hist_progress)

        # 3. Resolved event (if applicable)
        if cd["status"] == "Resolved":
            hist_resolved = ComplaintHistory(
                complaint_id=complaint.id,
                actor_id=admin_id,
                old_status="In Progress",
                new_status="Resolved",
                note=cd.get("note", "Completed."),
                created_at=resolved_time
            )
            db.add(hist_resolved)

    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed()
