# NGO LMS

A production-ready Learning Management System built for NGOs — course delivery,
role-based staff tools, and a responsive UI that works on everything from a phone
to a large monitor.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Database Migrations](#database-migrations)
- [Deployment Guide](#deployment-guide)
  - [Localhost](#1-localhost)
  - [Render](#2-render)
  - [Railway](#3-railway)
  - [Replit](#4-replit)
- [API Documentation](#api-documentation)
- [Future Improvements](#future-improvements)

---

## Project Overview

NGO LMS lets an organization run courses for students while giving staff (Head
Admin, Moderators, Instructors) the tools to manage users, content, and
resources. Donors get read-only visibility into published courses. The whole
app is designed to run **unchanged** across localhost, Render, Railway, and
Replit — only environment variables change between environments.

The database is **SQLite by default** (a single file, zero setup). If you ever
want Postgres or another database, you only change the `DATABASE_URL` — no
code changes required, since the backend talks to the database exclusively
through SQLAlchemy.

## Features

- **Authentication** — JWT-based login/signup, password hashing (bcrypt),
  a "forgot password" page that directs users to contact an administrator
  (no email sending in this phase).
- **RBAC** — Five roles: Head Admin, Moderator, Instructor, Student, Donor.
  - The Head Admin account is **seeded automatically** on first run.
  - Only the Head Admin can create Moderators and assign their permissions
    (manage users, manage courses, manage resources, manage enrollments,
    view reports).
  - Students self-register. Any user can later be promoted to another role
    by the Head Admin.
- **Courses** — Courses → Modules → Lessons hierarchy, publish/unpublish,
  student self-enrollment with progress tracking.
- **Resources** — Upload videos, images, PDF, DOCX, PPT, ZIP files, or attach
  external links (YouTube, Google Drive, Dropbox, OneDrive, Vimeo, or any
  public URL). All resources open in an in-app preview window instead of
  redirecting away from the site (YouTube/Vimeo/Drive embed directly; other
  links are framed with a fallback "open in new tab" if the source blocks
  embedding).
- **Course categories** — staff can create categories and tag courses; the
  course catalog can be filtered by category.
- **Quizzes** — staff build quizzes per course with multiple-choice,
  true/false, and short-answer questions; students take them and get an
  instant auto-graded score and pass/fail result.
- **Assignments** — staff post assignments per lesson with instructions;
  students upload a submission file; staff review submissions and enter a
  grade + feedback.
- **Certificates** — staff issue a certificate to any enrolled student for a
  course; each certificate gets a unique verification code
  (`GET /api/certificates/verify/{code}`, no auth required).
- **Donations & campaigns** — staff create fundraising campaigns with a goal
  amount; donors browse and donate, with a live progress bar and their own
  donation history.
- **Rich dashboards** — Head Admin/Moderator get KPI cards and real charts
  (registration trend, users by role, active/inactive, course status) driven
  by live backend stats. The public landing page shows live counters and
  featured courses/campaigns.
- **Storage abstraction** — Files are saved through a swappable storage
  backend. Local disk today; drop in an S3 or Cloudinary implementation
  later without touching any route or service code.
- **Fully responsive UI** — Collapsible sidebar on mobile, responsive
  tables (horizontal scroll), responsive forms/cards/charts, touch-friendly
  buttons, no horizontal overflow, from phones up to large monitors.

## Technology Stack

**Frontend:** React 19 · Vite · Tailwind CSS · React Router · Axios ·
React Hook Form · TanStack React Query · Chart.js

**Backend:** Python · FastAPI · SQLAlchemy ORM · Alembic · JWT
(python-jose) · Pydantic / Pydantic Settings

**Database:** SQLite (local file, default) — swappable to any SQLAlchemy-
supported database via one environment variable

**Storage:** Local uploads in development, behind an abstraction so
Cloudinary/S3 can be added later

## Folder Structure

```
ngo-lms/
├── backend/
│   ├── app/
│   │   ├── core/           # config, database session, security (JWT/hashing), RBAC deps
│   │   ├── models/         # SQLAlchemy models (User, Course, Module, Lesson, Resource, Enrollment)
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── routers/        # FastAPI routers (thin — no business logic)
│   │   ├── services/       # Business logic (auth, users, courses, resources, storage)
│   │   ├── middleware/     # Reserved for custom middleware
│   │   ├── utils/          # Shared helpers
│   │   ├── seed.py         # Seeds the Head Admin account on first run
│   │   └── main.py         # FastAPI app entrypoint
│   ├── alembic/            # Database migrations
│   ├── uploads/             # Local file storage (dev)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance + endpoint wrappers
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, Navbar, DashboardLayout
│   │   │   └── ui/           # Button, Card, Input, Table, Modal (reusable)
│   │   ├── context/          # AuthContext
│   │   ├── pages/             # Landing, Login, Signup, ForgotPassword, dashboard/*
│   │   └── styles/            # Tailwind entrypoint
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
└── README.md
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Git**

No database server is required for local development — SQLite ships with
Python.

## Environment Variables

### Backend (`backend/.env`, copy from `backend/.env.example`)

| Variable | Description | Local default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./ngo_lms.db` |
| `SECRET_KEY` | JWT signing secret — change in every real deployment | dev placeholder |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `STORAGE_DRIVER` | `local` (only implemented driver today) | `local` |
| `UPLOAD_DIR` | Folder for uploaded files | `uploads` |
| `MAX_UPLOAD_MB` | Max upload size hint | `200` |
| `HEAD_ADMIN_EMAIL` / `HEAD_ADMIN_PASSWORD` / `HEAD_ADMIN_NAME` | Seeded automatically on first run | see `.env.example` |

### Frontend (`frontend/.env`, copy from `frontend/.env.example`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend origin. Leave empty in dev (Vite proxies `/api`); set to your backend's URL when frontend and backend are on different domains (e.g. two separate Render services). |

## Running Locally

```bash
# 1. Clone the repository
git clone <your-fork-or-repo-url> ngo-lms
cd ngo-lms

# 2. Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows (cmd.exe or PowerShell)
pip install -r requirements.txt
cp .env.example .env             # macOS/Linux
# copy .env.example .env         # Windows cmd.exe
# Copy-Item .env.example .env    # Windows PowerShell

# 3. Database migrations (optional in dev — see note below)
alembic upgrade head

# 4. Run backend
uvicorn app.main:app --reload --port 8000
# Backend is now on http://localhost:8000
# Swagger docs: http://localhost:8000/docs
# The Head Admin account is created automatically on first startup.

# 5. Frontend setup (in a new terminal)
cd ../frontend
npm install
cp .env.example .env             # macOS/Linux
# copy .env.example .env         # Windows cmd.exe
# Copy-Item .env.example .env    # Windows PowerShell

# 6. Run frontend
npm run dev
# Frontend is now on http://localhost:5173

# 7. Access application
# Open http://localhost:5173 in your browser.
# Log in with the seeded Head Admin credentials from backend/.env
# (HEAD_ADMIN_EMAIL / HEAD_ADMIN_PASSWORD).
```

> **Windows note:** if `python` / `python3` isn't recognized, install it from
> [python.org](https://www.python.org/downloads/) (not the Microsoft Store
> alias) and make sure "Add Python to PATH" is checked during setup, or use
> the `py` launcher (`py -m venv .venv`) instead.

> **Note:** `app/main.py` also calls `Base.metadata.create_all()` on startup,
> so the SQLite file and tables are created automatically even if you skip
> step 3 in early development. Once you start making schema changes, switch
> to Alembic migrations (`alembic revision --autogenerate -m "message"` then
> `alembic upgrade head`) so changes are tracked and reproducible.

### Troubleshooting

- **`ValueError: password cannot be longer than 72 bytes` / `error reading
  bcrypt version` on startup** — this comes from an old `passlib`+`bcrypt`
  combo. This project hashes passwords with `bcrypt` directly (no
  `passlib`), so a fresh `pip install -r requirements.txt` resolves it. If
  you still see it, your virtualenv has a stale `passlib`/`bcrypt` install —
  delete `.venv` and reinstall.
- **`'cp' is not recognized...` (Windows `cmd.exe`)** — `cp` is a
  Unix command. Use `copy .env.example .env` in `cmd.exe` or
  `Copy-Item .env.example .env` in PowerShell instead.

## Database Migrations

```bash
cd backend
# Generate a migration after changing a model
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head

# Roll back one revision
alembic downgrade -1
```

---

## Deployment Guide

The app is designed so the **same code** runs on all of these targets —
only environment variables change.

### 1. Localhost

Covered in full in [Running Locally](#running-locally) above.

### 2. Render

**Backend (Web Service)**
- New → Web Service → connect your repo, root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: copy everything from `backend/.env.example`,
  set a strong `SECRET_KEY`, and set `CORS_ORIGINS` to your frontend's
  Render URL (e.g. `https://ngo-lms-frontend.onrender.com`)
- `DATABASE_URL` can stay as SQLite for a quick demo, **but Render's disk is
  ephemeral on the free tier** — for anything persistent, provision a
  Render PostgreSQL database and set `DATABASE_URL` to its connection
  string (no code changes needed).

**Frontend (Static Site)**
- New → Static Site → same repo, root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<your-backend>.onrender.com`

**PostgreSQL (optional, for persistence)**
- New → PostgreSQL → copy the "Internal Database URL" into the backend's
  `DATABASE_URL`. Run `alembic upgrade head` once (Render's Shell tab, or
  as a one-off Job) to create tables.

**Common issues**
- *CORS errors*: make sure `CORS_ORIGINS` on the backend exactly matches
  the frontend's deployed URL (including `https://`).
- *"Application failed to respond"*: confirm the start command binds to
  `0.0.0.0` and `$PORT`, not a hardcoded port.
- *Uploaded files disappear after redeploy*: expected on ephemeral disk —
  swap `STORAGE_DRIVER` to a persistent backend (S3/Cloudinary) for
  production use.

### 3. Railway

**Backend**
- New Project → Deploy from GitHub repo → set root directory to `backend`
- Build: Railway auto-detects Python; ensure `requirements.txt` is present
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add the same environment variables as the Render backend above

**Frontend**
- New service in the same project → root directory `frontend`
- Build command: `npm install && npm run build`
- Start command (if using a Node static server): `npx serve -s dist -l $PORT`
- Environment variable: `VITE_API_BASE_URL=https://<your-backend>.up.railway.app`

**PostgreSQL**
- Add a PostgreSQL plugin from Railway's marketplace, then copy its
  `DATABASE_URL` into the backend service's variables.

**Common issues**
- *Build succeeds but service crashes on boot*: check that `PORT` is read
  from the environment, not hardcoded — Railway assigns it dynamically.
- *Frontend can't reach backend*: double check `VITE_API_BASE_URL` was set
  **before** the build (Vite bakes env vars in at build time, not runtime).

### 4. Replit

- Create two Repls (or one Repl with two run configurations): one for
  `backend`, one for `frontend`.
- **Backend Repl**: language = Python. In the Shell:
  ```bash
  pip install -r requirements.txt
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
- **Frontend Repl**: language = Node.js. In the Shell:
  ```bash
  npm install
  npm run dev -- --host 0.0.0.0
  ```
- **Environment variables**: use Replit's "Secrets" panel to set the same
  keys as `backend/.env.example` and `frontend/.env.example`. Set
  `VITE_API_BASE_URL` to the backend Repl's public URL, and `CORS_ORIGINS`
  on the backend to the frontend Repl's public URL.
- **Database**: SQLite works as-is — the `.db` file lives in the backend
  Repl's filesystem. Note that Replit's free-tier filesystem can reset on
  redeploy, so treat it as a dev/demo environment.
- **Running both services**: keep both Repls running simultaneously (or
  use a single Repl with a `.replit` multi-process config) — the frontend
  needs the backend reachable at the URL set in `VITE_API_BASE_URL`.

---

## API Documentation

Interactive, always-current API docs are auto-generated by FastAPI and
available at **`/docs`** (Swagger UI) and **`/redoc`** on the running
backend — e.g. `http://localhost:8000/docs`.

Summary of the main endpoints:

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/signup` | Student self-registration | No |
| POST | `/api/auth/login` | Log in, returns access + refresh tokens | No |
| POST | `/api/auth/forgot-password` | Returns a "contact your administrator" message | No |
| GET | `/api/auth/me` | Current authenticated user | Yes |
| GET | `/api/users` | List all users | Yes (Head Admin) |
| POST | `/api/users/moderators` | Create a Moderator with permissions | Yes (Head Admin) |
| PATCH | `/api/users/moderators/{id}/permissions` | Update a Moderator's permissions | Yes (Head Admin) |
| PATCH | `/api/users/{id}/role` | Promote/change a user's role | Yes (Head Admin) |
| PATCH | `/api/users/{id}/active` | Activate/deactivate a user account | Yes (Head Admin) |
| GET | `/api/courses` | List courses (published-only for Students/Donors) | Yes |
| GET | `/api/courses/{id}` | Course detail with modules/lessons | Yes |
| POST | `/api/courses` | Create a course | Yes (staff) |
| POST | `/api/courses/{id}/publish` | Publish a course | Yes (staff) |
| POST | `/api/courses/{id}/unpublish` | Unpublish a course | Yes (staff) |
| POST | `/api/courses/{id}/modules` | Add a module | Yes (staff) |
| POST | `/api/courses/modules/{id}/lessons` | Add a lesson | Yes (staff) |
| POST | `/api/resources/upload` | Upload a file resource (multipart) | Yes (staff) |
| POST | `/api/resources/link` | Attach an external link resource | Yes (staff) |
| POST | `/api/enrollments/{course_id}` | Student enrolls in a course | Yes (Student) |
| GET | `/api/enrollments/me` | Current student's enrollments | Yes |
| GET | `/api/stats/users` | User counts, role breakdown, registration trend | Yes (Head Admin/Moderator) |
| GET | `/api/stats/courses` | Course/module/lesson/resource/enrollment totals | Yes (Head Admin/Moderator) |
| GET | `/api/users/export.csv` | Download all users as CSV | Yes (Head Admin) |
| GET | `/api/donations/campaigns` | List donation campaigns | Yes |
| POST | `/api/donations/campaigns` | Create a campaign | Yes (Head Admin/Moderator) |
| POST | `/api/donations/campaigns/{id}/donate` | Make a donation | Yes (Donor) |
| GET | `/api/donations/summary` | Total raised, donation count, active campaigns | Yes (Head Admin/Moderator) |
| GET | `/api/health` | Health check | No |

Full request/response bodies (with examples) are in the Swagger UI at `/docs`.

## Future Improvements

**Not yet built** (from the full feature wishlist — these are large enough to
warrant their own focused passes rather than being rushed in):
- Quizzes & assignments (question bank, auto-grading, submissions/review)
- Certificate generation (PDF + QR verification)
- Events & announcements module
- PDF export (CSV export is implemented; PDF needs a rendering library)
- Audit logs / activity feed, notification center, global search
- Real-time updates (WebSockets), dark mode, dashboard widget customization
- Payment gateway integration for real donations (currently records amounts
  without processing actual payment)

**Smaller items:**
- Email-based password reset (currently intentionally out of scope)
- S3 / Cloudinary storage backend implementations
- Course progress auto-tracking from lesson completion
- Refresh-token rotation and logout/blacklist endpoint
- Automated tests (pytest for backend, Vitest/RTL for frontend)
- CI pipeline (lint + test on every PR)
