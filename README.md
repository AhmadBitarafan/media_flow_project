# MediaFlow — Media Project Management System

A full-stack platform connecting **customers**, **freelancers**, and an **operations team** to manage media projects end-to-end.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + Django REST Framework |
| Auth | JWT (SimpleJWT — access + refresh + blacklist) |
| Frontend | React 18 + React Router 6 |
| Styling | CSS custom properties (dark theme, no framework dependency) |
| Database | SQLite (dev) / PostgreSQL (production) |
| File Storage | Local (dev) / S3-compatible (production) |

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for development)

# Run migrations
python manage.py migrate

# Seed demo data (creates 4 test accounts)
python manage.py seed_data

# Start backend server (port 8000)
python manage.py runserver
```

**Demo credentials created by seed_data:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@mediaflow.io | admin123! |
| Supervisor | supervisor@mediaflow.io | super123! |
| Customer | customer@example.com | customer123! |
| Freelancer | freelancer@example.com | freelancer123! |

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 3000, proxies /api → localhost:8000)
npm start
```

Open **http://localhost:3000** and log in with any demo account.

---

## Architecture Overview

```
mediaflow/
├── backend/
│   ├── config/               # Django settings (base, dev, prod), URLs, WSGI
│   │   └── settings/
│   ├── apps/
│   │   ├── accounts/         # Users, roles, FreelancerProfile, CustomerProfile, levels
│   │   ├── projects/         # ProjectRequest → Project → Assignment → Milestones → Revisions
│   │   ├── tickets/          # Support tickets + threaded replies
│   │   ├── files/            # Validated file uploads linked to any model
│   │   ├── wallets/          # Wallet, transactions, payments, invoices
│   │   ├── notifications/    # In-app notifications + email + pluggable SMS
│   │   ├── reviews/          # Customer reviews with admin moderation
│   │   └── audit/            # AuditLog model + middleware + dashboard stats
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/              # Axios client + all API functions (auth-aware, auto-refresh)
    │   ├── contexts/         # AuthContext (login/register/logout/me)
    │   ├── components/
    │   │   ├── common/       # Card, Table, Modal, Badge, Btn, StatCard, Timeline, etc.
    │   │   └── layout/       # AppShell (sidebar + topbar, role-based nav)
    │   ├── pages/
    │   │   ├── auth/         # LoginPage, RegisterPage
    │   │   ├── customer/     # Dashboard, SubmitRequest (3-step), Projects, ProjectDetail
    │   │   ├── freelancer/   # Dashboard, Projects, ProjectDetail (accept/bid/upload)
    │   │   ├── admin/        # Dashboard, Requests, Projects, ProjectDetail, Users, Wallets
    │   │   └── shared/       # Tickets, TicketDetail, Wallet, Profile, Notifications, 404
    │   └── utils/            # Date formatting, currency, badge color helpers
    └── package.json
```

---

## Core Workflow

```
Customer submits request
    ↓
Admin/Supervisor reviews → Approves → Converts to Project
    ↓
Admin assigns freelancer (manual) OR publishes as open for bids
    ↓
Freelancer accepts assignment / declares readiness
    ↓
Freelancer works → updates status → uploads deliverables
    ↓
Customer reviews deliverables
    ↓
Customer approves OR requests revision (up to max_revisions limit)
    ↓
Project marked complete → Review system → Freelancer wallet credited
```

---

## User Roles & Permissions

| Role | Capabilities |
|---|---|
| **Admin** | Full system access, all admin actions |
| **Supervisor** | Review requests, manage projects/users/tickets, adjust wallets |
| **Customer** | Submit requests, view own projects, request revisions, approve delivery, pay |
| **Freelancer** | View/accept assigned projects, bid on open projects, upload deliverables |

**Freelancer Level Visibility:**
- Level A → sees A, B, C projects
- Level B → sees B, C projects  
- Level C → sees C projects only
- Easily extensible by adding rows to `FreelancerLevel` table

---

## API Reference (key endpoints)

### Auth
```
POST /api/auth/login/           → { access, refresh, user }
POST /api/auth/register/        → { access, refresh, user }
POST /api/auth/refresh/         → { access }
POST /api/auth/logout/
GET  /api/auth/me/
PATCH /api/auth/me/
POST /api/auth/change-password/
```

### Projects
```
GET    /api/projects/                       → list (filtered by role)
POST   /api/projects/                       → create (admin/supervisor)
GET    /api/projects/{id}/
POST   /api/projects/{id}/assign/           → assign freelancer
POST   /api/projects/{id}/update_status/
POST   /api/projects/{id}/request_revision/
POST   /api/projects/{id}/review_revision/
POST   /api/projects/{id}/approve_delivery/
POST   /api/projects/{id}/accept_assignment/
POST   /api/projects/{id}/decline_assignment/
POST   /api/projects/{id}/bid/
GET    /api/projects/{id}/bids/
GET    /api/projects/{id}/milestones/
POST   /api/projects/{id}/milestones/

GET    /api/projects/requests/
POST   /api/projects/requests/
POST   /api/projects/requests/{id}/review/
POST   /api/projects/requests/{id}/convert_to_project/

GET    /api/projects/freelancer/dashboard/
```

### Tickets, Files, Wallets, Notifications
```
GET/POST  /api/tickets/
POST      /api/tickets/{id}/reply/
POST      /api/tickets/{id}/update_status/

POST      /api/files/upload/
GET       /api/files/?project={id}

GET       /api/wallets/my/
GET       /api/wallets/my/transactions/
POST      /api/wallets/admin/adjust/
GET/POST  /api/wallets/payments/
GET       /api/wallets/invoices/

GET       /api/notifications/
GET       /api/notifications/unread_count/
POST      /api/notifications/{id}/mark_read/
POST      /api/notifications/mark_all_read/

GET       /api/audit/stats/
GET       /api/audit/logs/
```

---

## Production Deployment

1. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
2. Configure `DATABASE_URL` (PostgreSQL)
3. Set `SECRET_KEY` to a secure random string
4. Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
5. Configure email (SendGrid/SMTP)
6. Optional: Set `USE_S3=True` + AWS credentials for file storage
7. Optional: Set `SMS_BACKEND` to Twilio adapter for SMS notifications

```bash
python manage.py collectstatic
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

---

## Extending the System

**Add a new freelancer level:**
```python
FreelancerLevel.objects.create(code='D', name='Trainee', rank=4, min_rating=0)
# Update visibility logic in FreelancerProfile.can_view_project_level()
```

**Add a new user role:**
```python
# Add to User.Role choices
# Add nav items to AppShell.jsx NAV map
# Add route in App.jsx
```

**Enable SMS (Twilio):**
```env
SMS_BACKEND=apps.notifications.sms.backends.console.TwilioSMSBackend
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
SMS_FROM_NUMBER=+15550000000
```

**Add a new notification type:**
```python
# Add to Notification.Type choices
# Add template to NOTIFICATION_TEMPLATES in notifications/service.py
# Call NotificationService.notify_user(user, 'new_type', {...})
```
