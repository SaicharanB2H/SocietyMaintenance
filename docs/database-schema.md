# Database Schema Documentation: Society Maintenance Tracker

This document details the database tables, relationships, types, and constraints used in the Society Maintenance Tracker application.

## Overview of Relationships

```text
       auth.users (Supabase Auth)
           │
           ▼ (1:1 synced via DB Trigger)
        profiles
        (id, full_name, email, role)
           │
           ├──────────────────────────────┐
           │ (1:N)                        │ (1:N)
           ▼                              ▼
      complaints                       notices
(id, resident_id, category,       (id, admin_id, title,
 description, photo_url,          content, is_important)
 status, priority, is_overdue)
           │
           ▼ (1:N)
    complaint_history
(id, complaint_id, actor_id,
 old_status, new_status, note)
```

---

## Tables

### 1. `profiles`
Holds application-specific profile data linked directly to Supabase Authentication (`auth.users.id`).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Matches the `id` from Supabase's `auth.users` table. |
| `full_name` | `TEXT` | | The user's full name, synced from metadata on register. |
| `email` | `TEXT` | `UNIQUE`, `NOT NULL` | Synced from Supabase Auth. |
| `role` | `TEXT` | `DEFAULT 'resident'`, `CHECK (role IN ('resident', 'admin'))` | The role controls permission levels on the API. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Time when profile was created. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Time when profile was last updated. |

### 2. `complaints`
Represents complaints raised by residents.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier. |
| `resident_id` | `UUID` | `REFERENCES profiles(id) ON DELETE CASCADE` | The resident who raised the complaint. |
| `category` | `TEXT` | `NOT NULL` | Complaint category (e.g., Plumbing, Electrical, Cleaning). |
| `description` | `TEXT` | `NOT NULL` | Detailed complaint message. |
| `photo_url` | `TEXT` | `NULL` | Supabase Storage URL for the attached image (if uploaded). |
| `status` | `TEXT` | `DEFAULT 'Open'`, `CHECK` (Open, In Progress, Resolved) | Current state in the complaint lifecycle. |
| `priority` | `TEXT` | `DEFAULT 'Low'`, `CHECK` (Low, Medium, High) | Level of urgency (managed by admin). |
| `is_overdue` | `BOOLEAN` | `DEFAULT FALSE` | Flag indicating if complaint resolution has crossed the threshold. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Time when raised. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Time when last updated. |
| `resolved_at` | `TIMESTAMP WITH TIME ZONE` | `NULL` | Set when status transitions to `Resolved`. |

### 3. `complaint_history`
An immutable log record created automatically on every status transition. This log is used to draw timelines.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique log identifier. |
| `complaint_id` | `UUID` | `REFERENCES complaints(id) ON DELETE CASCADE` | Link to the complaint. |
| `actor_id` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | The profile that performed the status change. |
| `old_status` | `TEXT` | `CHECK` (Open, In Progress, Resolved, NULL) | Previous status (NULL when first created). |
| `new_status` | `TEXT` | `CHECK` (Open, In Progress, Resolved), `NOT NULL` | The newly set status. |
| `note` | `TEXT` | `NULL` | Status transition comments (e.g., "Plumber assigned"). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Date/time of the state transition. |

### 4. `notices`
Notice board announcements created by admins.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique notice identifier. |
| `admin_id` | `UUID` | `REFERENCES profiles(id) ON DELETE CASCADE` | Admin who posted the notice. |
| `title` | `TEXT` | `NOT NULL` | Heading of the notice. |
| `content` | `TEXT` | `NOT NULL` | Notice content text. |
| `is_important` | `BOOLEAN` | `DEFAULT FALSE` | Pinned status. Pinned notices are sorted first. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Posting time. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Edit time. |

### 5. `system_settings`
Global configuration settings for the society tracker.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Configuration record identifier. |
| `overdue_threshold_days` | `INTEGER` | `DEFAULT 7 NOT NULL` | Number of days before an unresolved complaint is flagged overdue. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()`, `NOT NULL` | Configuration update time. |

---

## Design Choices & Rationale

### Synced Profiles Table
Supabase Auth resides in a protected database schema (`auth`). We maintain a corresponding `public.profiles` table synced automatically using PostgreSQL triggers. This separates application-level domain entities (like roles, notices, and history links) from the core authentication fields, and allows us to easily execute table JOINs.

### Immutable History vs. Status Overwriting
Instead of overwriting the status field and losing history, every state transition generates a row in `complaint_history`.
- **Chronological Auditing**: Residents and admins can view the complete step-by-step progress timeline of a complaint (e.g., Open ➔ In Progress ➔ Resolved), along with who did it and any notes.
- **Security**: The history is completely write-once/read-only (immutable). Updates and deletes are disabled to maintain system audit integrity.

### Dynamic Overdue Evaluation
The `is_overdue` field is managed dynamically:
- Resolved complaints can never be overdue.
- Unresolved complaints (Open, In Progress) are evaluated relative to `system_settings.overdue_threshold_days`.
- During query operations, overdue statuses are computed dynamically or updated through background tasks to ensure they match real-time settings configurations.
