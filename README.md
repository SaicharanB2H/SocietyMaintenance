# Society Maintenance Tracker

A production-ready full-stack web application designed for apartment societies. Residents can raise maintenance complaints and track their progress, while administrators can manage complaints, priorities, overdue issues, notices, and view dashboard analytics.

---

## Architecture & Tech Stack

### Frontend
- **Framework:** React with Vite (JavaScript)
- **Routing:** React Router v6
- **HTTP Client:** Axios with dynamic JWT interceptors
- **Forms:** React Hook Form for client validations
- **Charts:** Recharts for admin analytics
- **Styling:** Custom CSS and glassmorphic designs (No Tailwind)
- **Icons:** Lucide React

### Backend
- **Framework:** Python, FastAPI
- **Database ORM:** SQLAlchemy (PostgreSQL connection)
- **Auth Engine:** Supabase Authentication
- **Storage Bucket:** Supabase Storage (complaint photo uploads)
- **Notification Engine:** Google SMTP (Gmail Service)

---

## Core Features

- **Resident Dashboard:** Raise complaints, upload snaps, review detailed status history timeline, and check notice boards.
- **Admin Dashboard:** Real-time KPI summaries, overdue items, charts by category, status, and 30-day trends.
- **Complaint Lifecycle:** Validated states (`Open` ➔ `In Progress` ➔ `Resolved`). Resolved complaints set `resolved_at` and lock transitions.
- **Overdue Engine:** Unresolved complaints crossing the admin-configured threshold are dynamically flagged overdue.
- **Notice Board:** Admin postings with important notices pinned at the top and broadcasted via email to all residents.
- **Transaction Safety:** Status updates and timeline logs are executed in database transaction blocks.

---

## Folder Structure

```text
society-maintenance-tracker/
├── database/
│   ├── seed.sql             # SQL Schema definition & triggers
│   └── seed_db.py           # Database seeder script
├── docs/
│   ├── system-design.md     # Engineering design rationale
│   ├── database-schema.md   # Schema tables & relationships
│   └── api.md               # Endpoints description
├── backend/
│   ├── app/
│   │   ├── core/            # Config, database, security
│   │   ├── models/          # SQLAlchemy tables
│   │   ├── schemas/         # Pydantic validators
│   │   ├── dependencies/    # Auth middleware
│   │   ├── services/        # Storage, Email, Complaint logic
│   │   └── routers/         # Routes (Auth, Complaints, Notices, Dashboard, Settings)
│   ├── tests/               # Pytest suites
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Badges, Card, Table, Timeline, Dialog, Pagination
│   │   ├── context/         # AuthContext
│   │   ├── layouts/         # DashboardLayout
│   │   ├── pages/           # Login, Register, Dashboards, Raise, Notices, Profile, Settings
│   │   ├── services/        # api.js (Axios), supabase.js (Client)
│   │   └── styles/          # variables.css, global.css
│   ├── .env.example
│   └── package.json
├── docker-compose.yml       # Local PostgreSQL database
└── README.md
```

---

## Installation & Setup

### 1. Supabase Setup
1. Create a project at [Supabase](https://supabase.com).
2. Go to **SQL Editor** and run the contents of [seed.sql](file:///d:/vue%20js/Unthinkable/database/seed.sql). This sets up the profiles table, complaints, history log, notices, settings, and the database trigger to synchronize auth users.
3. In **Storage**, create a public bucket named `complaint-photos`. Under bucket policies, allow public access for selects/inserts.

### 2. Environment Configurations
Create `.env` files in both directories.

#### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres.yourproject:yourpassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=complaint-photos

# Google SMTP Credentials for Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_gmail@gmail.com

FRONTEND_URL=http://localhost:5173
OVERDUE_THRESHOLD_DAYS=7
```
*Note: If `SMTP_USER` and `SMTP_PASSWORD` are left empty during development, emails will degrade gracefully and log contents directly to stdout.*

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Local Development

### Running the Backend
1. Initialize a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
4. Access API docs at `http://localhost:8000/docs`.

### Running the Frontend
1. Move to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node packages:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

---

## Seeding Database
To populate your database with 1 Admin, 5 Residents, 10 complaints, history timeline logs, and notice board announcements:
```bash
# Make sure your backend virtual environment is active
cd database
python seed_db.py
```
*Users will be created in Supabase Auth with password `password123`. The admin login is `admin@society.com`.*

---

## Running Tests
Run python API tests with `pytest`:
```bash
cd backend
pytest -v
```

---

## Deployment

### Frontend (Vercel)
1. Install Vercel CLI or link repo on Vercel Dashboard.
2. Ensure Vercel overrides the build command to `npm run build`.
3. Configure Environment Variables: `VITE_API_URL` (deployed backend URL), `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.

### Backend (Render / Railway)
1. Add the project repository.
2. Build Command: `pip install -r requirements.txt`.
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Configure all environment variables listed in the backend configuration section.
