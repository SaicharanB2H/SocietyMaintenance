import os
import pytest
from datetime import datetime, timedelta

# Inject mock environment variables so Pydantic settings validates successfully during tests
os.environ["DATABASE_URL"] = "postgresql://postgres:mock@localhost:5432/postgres"
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "mock-anon-key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "mock-service-role-key"
os.environ["SUPABASE_STORAGE_BUCKET"] = "complaint-photos"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.profile import Profile
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.notice import Notice
from app.models.settings import SystemSettings
import uuid

# SQLite configuration for testing
from sqlalchemy.pool import StaticPool
DATABASE_URL = "sqlite://" # In-memory database
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Active testing context
test_user_profile = None

def override_get_current_user():
    if not test_user_profile:
        raise Exception("Test user not configured")
    return test_user_profile

def override_get_current_admin():
    if not test_user_profile or test_user_profile.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden")
    return test_user_profile

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_admin] = override_get_current_admin
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Initialize default settings
    default_settings = SystemSettings(
        id=uuid.UUID("a0000000-0000-0000-0000-000000000001"),
        overdue_threshold_days=7
    )
    session.add(default_settings)
    session.commit()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)

def create_mock_user(db, user_id, email, full_name, role="resident"):
    profile = Profile(
        id=user_id,
        email=email,
        full_name=full_name,
        role=role
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# --- TEST CASES ---

def test_unauthorized_if_no_token(client):
    # Temporarily remove auth overrides to test raw authentication guard
    app.dependency_overrides.clear()
    response = client.get("/api/auth/me")
    assert response.status_code in [401, 403]

def test_resident_profile_fetch(db_session, client):
    global test_user_profile
    user_id = uuid.uuid4()
    test_user_profile = create_mock_user(db_session, user_id, "res@mail.com", "John Resident", "resident")

    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "res@mail.com"
    assert data["role"] == "resident"

def test_resident_creates_complaint(db_session, client):
    global test_user_profile
    user_id = uuid.uuid4()
    test_user_profile = create_mock_user(db_session, user_id, "res@mail.com", "John Resident", "resident")

    response = client.post(
        "/api/complaints",
        data={"category": "Plumbing", "description": "Water leakage in kitchen sink"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "Plumbing"
    assert data["status"] == "Open"
    assert data["priority"] == "Low"

    # Verify history entry created
    history = db_session.query(ComplaintHistory).filter(ComplaintHistory.complaint_id == uuid.UUID(data["id"])).all()
    assert len(history) == 1
    assert history[0].new_status == "Open"
    assert history[0].old_status is None

def test_resident_only_sees_own_complaints(db_session, client):
    # Create two residents
    res1_id = uuid.uuid4()
    res2_id = uuid.uuid4()
    res1 = create_mock_user(db_session, res1_id, "res1@mail.com", "Res One", "resident")
    res2 = create_mock_user(db_session, res2_id, "res2@mail.com", "Res Two", "resident")

    # Create complaints for both
    c1 = Complaint(resident_id=res1_id, category="Electrical", description="Short circuit", status="Open")
    c2 = Complaint(resident_id=res2_id, category="Cleaning", description="Trash pile", status="Open")
    db_session.add_all([c1, c2])
    db_session.commit()

    global test_user_profile
    # Log in as resident 1
    test_user_profile = res1
    response = client.get("/api/complaints")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["description"] == "Short circuit"

    # Resident 1 cannot view Resident 2's details
    response_detail = client.get(f"/api/complaints/{c2.id}")
    assert response_detail.status_code == 403

def test_admin_sees_all_complaints(db_session, client):
    # Create residents
    res1_id = uuid.uuid4()
    res2_id = uuid.uuid4()
    create_mock_user(db_session, res1_id, "res1@mail.com", "Res One", "resident")
    create_mock_user(db_session, res2_id, "res2@mail.com", "Res Two", "resident")

    c1 = Complaint(resident_id=res1_id, category="Electrical", description="Short circuit", status="Open")
    c2 = Complaint(resident_id=res2_id, category="Cleaning", description="Trash pile", status="Open")
    db_session.add_all([c1, c2])
    db_session.commit()

    global test_user_profile
    # Log in as admin
    admin_id = uuid.uuid4()
    test_user_profile = create_mock_user(db_session, admin_id, "admin@mail.com", "Admin Boss", "admin")

    response = client.get("/api/complaints")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2

def test_admin_updates_priority_and_status(db_session, client):
    res_id = uuid.uuid4()
    create_mock_user(db_session, res_id, "res@mail.com", "Resident", "resident")
    c = Complaint(resident_id=res_id, category="Plumbing", description="Sink leak", status="Open", priority="Low")
    db_session.add(c)
    db_session.commit()

    global test_user_profile
    admin_id = uuid.uuid4()
    test_user_profile = create_mock_user(db_session, admin_id, "admin@mail.com", "Admin Boss", "admin")

    # 1. Update priority (does NOT create history entry)
    res_pri = client.patch(f"/api/complaints/{c.id}/priority", json={"priority": "High"})
    assert res_pri.status_code == 200
    assert res_pri.json()["priority"] == "High"
    
    history_pri = db_session.query(ComplaintHistory).filter(ComplaintHistory.complaint_id == c.id).all()
    assert len(history_pri) == 0

    # 2. Update status (creates history entry)
    res_stat = client.patch(f"/api/complaints/{c.id}/status", json={"status": "In Progress", "note": "Technician dispatched"})
    assert res_stat.status_code == 200
    assert res_stat.json()["status"] == "In Progress"

    history_stat = db_session.query(ComplaintHistory).filter(ComplaintHistory.complaint_id == c.id).all()
    assert len(history_stat) == 1
    assert history_stat[0].old_status == "Open"
    assert history_stat[0].new_status == "In Progress"
    assert history_stat[0].note == "Technician dispatched"

def test_admin_cannot_reopen_resolved(db_session, client):
    res_id = uuid.uuid4()
    create_mock_user(db_session, res_id, "res@mail.com", "Resident", "resident")
    c = Complaint(resident_id=res_id, category="Plumbing", description="Sink leak", status="Resolved")
    db_session.add(c)
    db_session.commit()

    global test_user_profile
    admin_id = uuid.uuid4()
    test_user_profile = create_mock_user(db_session, admin_id, "admin@mail.com", "Admin Boss", "admin")

    # Update resolved to Open (should fail)
    response = client.patch(f"/api/complaints/{c.id}/status", json={"status": "Open", "note": "Reopening"})
    assert response.status_code == 400

def test_overdue_complaint_detection(db_session, client):
    res_id = uuid.uuid4()
    res = create_mock_user(db_session, res_id, "res@mail.com", "Resident", "resident")

    # Overdue threshold is 7 days. Create complaint created 10 days ago (unresolved)
    ten_days_ago = datetime.utcnow() - timedelta(days=10)
    c1 = Complaint(
        resident_id=res_id,
        category="Plumbing",
        description="Sink leak",
        status="Open",
        created_at=ten_days_ago
    )
    # Create complaint created 10 days ago (resolved)
    c2 = Complaint(
        resident_id=res_id,
        category="Electrical",
        description="Fuse blown",
        status="Resolved",
        created_at=ten_days_ago
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    global test_user_profile
    test_user_profile = res

    # Trigger dynamic overdue check during detail retrieval
    res_c1 = client.get(f"/api/complaints/{c1.id}")
    assert res_c1.status_code == 200
    assert res_c1.json()["is_overdue"] is True

    # Resolved complaint is never overdue
    res_c2 = client.get(f"/api/complaints/{c2.id}")
    assert res_c2.status_code == 200
    assert res_c2.json()["is_overdue"] is False

def test_notices_permissions(db_session, client):
    res_id = uuid.uuid4()
    res = create_mock_user(db_session, res_id, "res@mail.com", "Resident", "resident")
    admin_id = uuid.uuid4()
    admin = create_mock_user(db_session, admin_id, "admin@mail.com", "Admin Boss", "admin")

    global test_user_profile
    
    # 1. Resident cannot create notices
    test_user_profile = res
    response_res = client.post("/api/notices", json={"title": "Notice 1", "content": "Notice content", "is_important": False})
    assert response_res.status_code == 403

    # 2. Admin can create notice
    test_user_profile = admin
    response_admin = client.post("/api/notices", json={"title": "Notice 1", "content": "Notice content", "is_important": True})
    assert response_admin.status_code == 201
    
    # 3. Resident can read notices
    test_user_profile = res
    response_get = client.get("/api/notices")
    assert response_get.status_code == 200
    assert len(response_get.json()) == 1
