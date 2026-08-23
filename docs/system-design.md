# System Design Document: Society Maintenance Tracker

This document provides a concise overview of the core architectural decisions and engineering implementations for the Society Maintenance Tracker application.

---

## 1. Complaint History Model
Rather than simple columns that get updated in place, complaint status tracking is modeled as an append-only, immutable event log stored in `complaint_history`. 

### Rationale:
- **Audit Trails**: Ensures trust. Residents and administration have a historical record of transitions (e.g. Open ➔ In Progress ➔ Resolved), detailing who made the change (actor), the transition timestamp, and notes explaining why (e.g. "Spare parts ordered").
- **Immutability**: Logs are write-once/read-only. Update or delete operations on `complaint_history` are blocked by application-level logic to maintain historical integrity.

---

## 2. Dynamic Overdue Detection
Complaints that remain unresolved for too long are flagged as `is_overdue`.

### Mechanics:
- **Configurable Settings**: A central `system_settings` table stores the threshold value (defaults to `7` days), editable by admins.
- **Dynamic Queries**: The overdue state is evaluated dynamically:
  $$\text{Current Time} - \text{Complaint Created Time} > \text{Threshold Days}$$
- **Exclusion of Resolved Issues**: Resolved complaints are terminal. Even if resolved months after submission, they are marked resolved and are **never** considered overdue.
- **Real-Time Evaluation**: To ensure accuracy, the database is dynamically checked and updated during detail fetching and list paginations.

---

## 3. Storage Integration & Photo Handling
Images submitted with complaints are managed via Supabase Storage.

### Rationale:
- **Database Performance**: Storing image binaries directly in PostgreSQL (using `BYTEA`) causes table bloating, memory issues during database indexing, and slow query performance.
- **Decoupled Uploads**:
  1. The resident uploads the file via multipart form.
  2. The FastAPI backend validates file headers (mime type, e.g. PNG/JPEG) and checks file size limits (5MB).
  3. The backend uploads the raw binary stream to the `complaint-photos` bucket on Supabase Storage using the secure Service Role credential.
  4. Only the resulting public URL is stored in the database's `complaints.photo_url` column.

---

## 4. Notification Flow & Background Processing
Sending transactional emails should never block database updates or result in request failures. The system uses a decoupled background task model:

```text
Admin patches Status
        │
        ▼
Start DB Transaction
        │
        ├─► Update status column in complaints
        ├─► Insert timeline log in complaint_history
        ▼
Commit DB Transaction
        │
        ▼ (FastAPI Background Task)
Queue SMTP Email Job
        │
        ▼
Connect & Authenticate with Google SMTP (Gmail Service)
        │
        ├─► Success: Email sent to resident
        └─► Failure: Log errors (Graceful degradation, transaction remains intact)
```

### Notice Broadcasts:
When an admin posts an notice flagged as **Important**:
1. The notice is committed to database.
2. A background task is scheduled.
3. The task queries all resident emails from the database and broadcasts the announcement text via SMTP, skipping normal notices to avoid spam.
