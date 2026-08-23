# API Documentation: Society Maintenance Tracker

This document describes the REST APIs exposed by the FastAPI backend. All endpoints are prefixed with `/api`.

---

## Authentication

### 1. Get Current User Profile
* **Endpoint:** `GET /auth/me`
* **Headers:** `Authorization: Bearer <Supabase JWT>`
* **Description:** Decodes the token, checks the profiles table, and returns the profile details.
* **Response (200 OK):**
  ```json
  {
    "id": "27e4fa16-6cbb-469b-98df-8924151a6dc4",
    "full_name": "Resident Name",
    "email": "[EMAIL_ADDRESS]",
    "role": "resident",
    "created_at": "2026-08-21T09:15:30Z",
    "updated_at": "2026-08-21T09:15:30Z"
  }
  ```

---

## Complaints Management

### 1. File a Complaint
* **Endpoint:** `POST /complaints`
* **Content-Type:** `multipart/form-data`
* **Request Fields:**
  * `category` (string, required): e.g., Plumbing, Electrical, Lift.
  * `description` (string, required): min 10, max 1000 characters.
  * `photo` (binary file, optional): JPEG, PNG, WEBP (Max 5MB).
* **Response (201 Created):**
  ```json
  {
    "id": "e9b5f543-02f5-46aa-bf7d-9fa668e1ab30",
    "resident_id": "27e4fa16-6cbb-469b-98df-8924151a6dc4",
    "resident_name": "John Doe",
    "category": "Plumbing",
    "description": "Leaky pipe in the kitchen sink area.",
    "photo_url": "https://yourproject.supabase.co/storage/v1/object/public/complaint-photos/uuid.jpg",
    "status": "Open",
    "priority": "Low",
    "is_overdue": false,
    "created_at": "2026-08-21T10:00:00Z",
    "updated_at": "2026-08-21T10:00:00Z",
    "resolved_at": null
  }
  ```

### 2. List Complaints
* **Endpoint:** `GET /complaints`
* **Query Parameters:**
  * `page` (int, default: 1)
  * `limit` (int, default: 20)
  * `category` (string, optional)
  * `status` (string, optional)
  * `priority` (string, optional)
  * `overdue_only` (bool, optional)
  * `search` (string, optional)
  * `sort_by` (string, default: 'overdue'): options: `newest`, `oldest`, `priority`, `overdue`
  * `date_start` (ISO DateTime, optional)
  * `date_end` (ISO DateTime, optional)
* **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "e9b5f543-02f5-46aa-bf7d-9fa668e1ab30",
        "resident_name": "John Doe",
        "category": "Plumbing",
        "status": "Open",
        "priority": "Low",
        "is_overdue": false,
        "created_at": "2026-08-21T10:00:00Z",
        "updated_at": "2026-08-21T10:00:00Z",
        "resolved_at": null
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
  ```

### 3. Get Complaint Details (with history)
* **Endpoint:** `GET /complaints/{id}`
* **Response (200 OK):**
  ```json
  {
    "id": "e9b5f543-02f5-46aa-bf7d-9fa668e1ab30",
    "resident_id": "27e4fa16-6cbb-469b-98df-8924151a6dc4",
    "resident_name": "John Doe",
    "category": "Plumbing",
    "description": "Leaky pipe in the kitchen sink area.",
    "photo_url": "...",
    "status": "Open",
    "priority": "Low",
    "is_overdue": false,
    "created_at": "2026-08-21T10:00:00Z",
    "updated_at": "2026-08-21T10:00:00Z",
    "resolved_at": null,
    "history": [
      {
        "id": "1b088820-2c70-4f51-a9f6-0df9ff15b4ad",
        "complaint_id": "e9b5f543-02f5-46aa-bf7d-9fa668e1ab30",
        "actor_id": "27e4fa16-6cbb-469b-98df-8924151a6dc4",
        "actor_name": "John Doe",
        "old_status": null,
        "new_status": "Open",
        "note": "Complaint registered.",
        "created_at": "2026-08-21T10:00:00Z"
      }
    ]
  }
  ```

### 4. Assign Urgency Level (Admin only)
* **Endpoint:** `PATCH /complaints/{id}/priority`
* **Body:**
  ```json
  {
    "priority": "High"
  }
  ```
* **Response (200 OK):** Updated complaint representation.

### 5. Transition Status (Admin only)
* **Endpoint:** `PATCH /complaints/{id}/status`
* **Body:**
  ```json
  {
    "status": "In Progress",
    "note": "Plumber assigned, work in progress"
  }
  ```
* **Response (200 OK):** Updated complaint representation.

---

## Notice Board

### 1. List Notice Board Announcements
* **Endpoint:** `GET /notices`
* **Response (200 OK):** Pinned (important) notices are returned first.
  ```json
  [
    {
      "id": "a183ba7b-d72b-426b-95bb-dbce6d0263b6",
      "admin_id": "f898382e-8392-4ab6-8f3b-efef4e4e9abc",
      "admin_name": "Chief Admin",
      "title": "Water Tank Cleaning Tomorrow",
      "content": "Water supply shutdown tomorrow from 10 AM to 1 PM...",
      "is_important": true,
      "created_at": "2026-08-21T09:00:00Z",
      "updated_at": "2026-08-21T09:00:00Z"
    }
  ]
  ```

### 2. Publish Notice (Admin only)
* **Endpoint:** `POST /notices`
* **Body:**
  ```json
  {
    "title": "Annual Meeting Agenda",
    "content": "Meeting scheduled for Sunday at 4 PM...",
    "is_important": true
  }
  ```
* **Response (201 Created):** Created notice. Broadcasts email to all residents if `is_important` is true.

### 3. Edit Notice (Admin only)
* **Endpoint:** `PATCH /notices/{id}`
* **Body:** Fields to update (title, content, is_important).
* **Response (200 OK):** Updated notice.

### 4. Delete Notice (Admin only)
* **Endpoint:** `DELETE /notices/{id}`
* **Response:** `204 No Content`

---

## Analytical Dashboards

### 1. Get Metric Summaries
* **Endpoint:** `GET /dashboard/summary`
* **Description:** Retrieves total, open, in progress, resolved, and overdue complaint counts. Auto-filters to user's scope.
* **Response (200 OK):**
  ```json
  {
    "total": 12,
    "open": 4,
    "in_progress": 5,
    "resolved": 3,
    "overdue": 2
  }
  ```

### 2. Group by Status
* **Endpoint:** `GET /dashboard/status`
* **Response (200 OK):**
  ```json
  [
    { "status": "Open", "count": 4 },
    { "status": "In Progress", "count": 5 },
    { "status": "Resolved", "count": 3 }
  ]
  ```

### 3. Group by Category
* **Endpoint:** `GET /dashboard/categories`
* **Response (200 OK):**
  ```json
  [
    { "category": "Plumbing", "count": 5 },
    { "category": "Electrical", "count": 4 },
    { "category": "Other", "count": 3 }
  ]
  ```

### 4. Daily Trends (Last 30 days)
* **Endpoint:** `GET /dashboard/trends`
* **Response (200 OK):** Chronological list containing dates and complaint counts.
  ```json
  [
    { "date": "2026-08-01", "count": 1 },
    { "date": "2026-08-02", "count": 0 }
  ]
  ```

---

## System Settings

### 1. Fetch Configuration (Authenticated only)
* **Endpoint:** `GET /settings`
* **Response (200 OK):**
  ```json
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "overdue_threshold_days": 7,
    "updated_at": "2026-08-21T09:10:00Z"
  }
  ```

### 2. Update Configurations (Admin only)
* **Endpoint:** `PATCH /settings`
* **Body:**
  ```json
  {
    "overdue_threshold_days": 10
  }
  ```
* **Response (200 OK):** Updated settings.
