# پناه (Panah)

**پلتفرم نجات و امداد هوشمند**

Enterprise-grade smart rescue and relief platform for volunteer coordination during emergencies.

Developed by **Investica Group**.

---

## Requirements

| Requirement | Version |
|-------------|---------|
| Docker Desktop | Latest (includes Docker Compose V2) |
| OS | Windows 10/11, Ubuntu 24.04 LTS, or macOS |

No local installation of Python, Node.js, or PostgreSQL is required.

---

## Quick Start (Windows)

Double-click the batch files in the project root:

| File | Purpose |
|------|---------|
| **`SETUP.bat`** | First-time setup (build images, start services, seed data) |
| **`Start.bat`** | Start the platform (fast, no rebuild) |
| **`Stop.bat`** | Stop the platform (data is preserved) |

### First run

1. Install and start **Docker Desktop**
2. Run **`SETUP.bat`** (may take 5–15 minutes)
3. Open http://localhost in your browser

### Daily use

- **Start:** `Start.bat`
- **Stop:** `Stop.bat`

---

## Quick Start (Linux / Ubuntu)

```bash
chmod +x SETUP.sh Start.sh Stop.sh
./SETUP.sh      # First time only
./Start.sh      # Start
./Stop.sh       # Stop
```

---

## Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Website (Frontend)** | http://localhost | Main application (Persian RTL UI) |
| **Login** | http://localhost/login | User login page |
| **Register** | http://localhost/register | Volunteer registration |
| **API Base (v1)** | http://localhost/api/v1/ | REST API root |
| **Health Check** | http://localhost/api/v1/health/ | Service health status |
| **Swagger UI** | http://localhost/api/docs/ | Interactive API documentation |
| **OpenAPI Schema** | http://localhost/api/schema/ | Machine-readable API schema |
| **Django Admin** | http://localhost/admin/ | Django built-in admin panel |
| **PgAdmin** | http://localhost:5050 | PostgreSQL database manager |
| **Mailhog** | http://localhost:8025 | Dev email inbox (captured emails) |

---

## Default Credentials

> **Change all passwords before deploying to production.**

### Application Admin (Web Login)

| Field | Value |
|-------|-------|
| **Email** | `InvesticaCO@gmail.com` |
| **Password** | `Investica003` |
| **Role** | Admin (full access) |

Use these credentials at http://localhost/login

### PgAdmin (Database UI)

| Field | Value |
|-------|-------|
| **Email** | `admin@example.com` |
| **Password** | `admin` |
| **URL** | http://localhost:5050 |

Pre-configured PostgreSQL server appears automatically after login.

### PostgreSQL (Direct Connection)

| Field | Value |
|-------|-------|
| **Host** | `localhost` (from host) / `volunteer-management-postgres` (from Docker network) |
| **Port** | `5432` (internal only; not exposed to host by default) |
| **Database** | `volunteer_management` |
| **Username** | `volunteer_user` |
| **Password** | `volunteer_pass` |

Connect via PgAdmin or:

```bash
docker compose exec volunteer-management-postgres psql -U volunteer_user -d volunteer_management
```

### Redis

| Field | Value |
|-------|-------|
| **Host** | `volunteer-management-redis` (Docker internal) |
| **Port** | `6379` |

---

## User Roles

Seeded automatically by `seed_data`:

| Role | Slug | Description |
|------|------|-------------|
| **Admin** | `admin` | Full system access, user/role management |
| **Coordinator** | `coordinator` | Manage disasters, missions, assignments |
| **Volunteer** | `volunteer` | View/accept missions, submit reports |
| **Viewer** | `viewer` | Read-only access to operations data |

Roles and permissions are dynamic (database-driven RBAC).

---

## Docker Containers

| Container | Purpose |
|-----------|---------|
| `volunteer-management-nginx` | Reverse proxy (ports 80, 443) |
| `volunteer-management-frontend` | React SPA (Vite dev server) |
| `volunteer-management-backend` | Django REST API (Gunicorn/runserver) |
| `volunteer-management-celery` | Background task worker |
| `volunteer-management-celery-beat` | Scheduled tasks |
| `volunteer-management-postgres` | PostgreSQL 17 database |
| `volunteer-management-redis` | Cache, Celery broker, JWT blacklist |
| `volunteer-management-pgadmin` | Database management UI |
| `volunteer-management-mailhog` | Dev SMTP / email viewer |

---

## Common Commands

```bash
# View running containers
docker compose ps

# View backend logs
docker compose logs -f volunteer-management-backend

# Run database migrations
docker compose exec volunteer-management-backend python manage.py migrate

# Seed roles, permissions, and admin user
docker compose exec volunteer-management-backend python manage.py seed_data

# Seed demo disaster + mission scenario
docker compose exec volunteer-management-backend python manage.py seed_demo

# Open backend shell
docker compose exec volunteer-management-backend bash

# Rebuild everything from scratch
docker compose down
docker compose up -d --build
```

### Custom admin credentials on seed

```bash
docker compose exec volunteer-management-backend python manage.py seed_data \
  --admin-email you@example.com \
  --admin-password YourSecurePass123!
```

---

## API Overview

Base URL: `http://localhost/api/v1/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login/` | JWT login |
| `POST` | `/auth/logout/` | Logout (blacklist refresh token) |
| `POST` | `/auth/refresh/` | Refresh access token |
| `GET` | `/auth/me/` | Current user profile |
| `POST` | `/volunteers/register/` | Public volunteer registration |
| `GET` | `/volunteers/` | List volunteers |
| `POST` | `/volunteers/{id}/approve/` | Approve volunteer |
| `GET` | `/disasters/` | List disasters |
| `GET` | `/missions/` | List missions |
| `GET` | `/assignments/my/` | My assignments (volunteer) |
| `PATCH` | `/assignments/{id}/accept/` | Accept assignment |
| `GET` | `/dashboard/stats/` | Dashboard KPIs |
| `GET` | `/notifications/` | In-app notifications |

Full documentation: http://localhost/api/docs/

---

## Project Structure

```
├── SETUP.bat / Start.bat / Stop.bat   # Windows launcher scripts
├── SETUP.sh  / Start.sh  / Stop.sh    # Linux launcher scripts
├── docker-compose.yml                 # Development stack
├── docker-compose.prod.yml            # Production overrides
├── .env.example                       # Environment template
├── backend/                           # Django 5.2 REST API
├── frontend/                          # React 19 + MUI (Persian RTL)
├── infrastructure/                    # Nginx, Docker scripts, backups
├── documentation/                     # Architecture docs, ADRs, runbooks
└── environment/                       # Environment file templates
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.13, Django 5.2, DRF, SimpleJWT, Celery |
| Frontend | React 19, Vite, MUI v6, Redux Toolkit, TanStack Query |
| Database | PostgreSQL 17 |
| Cache / Queue | Redis 7 |
| Proxy | Nginx |
| Containers | Docker Compose |

---

## Production Deployment

```bash
cp environment/.env.production.example .env
# Edit .env with strong secrets
# Configure SSL: cp infrastructure/nginx/conf.d/ssl.conf.example infrastructure/nginx/conf.d/ssl.conf

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

See [documentation/runbooks/deployment.md](documentation/runbooks/deployment.md) for Ubuntu VPS setup.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Docker not running | Start Docker Desktop, then run `Start.bat` again |
| `.env` not found | Run `SETUP.bat` first |
| Port 80 already in use | Stop IIS or other web server, or change nginx port in `docker-compose.yml` |
| Backend unhealthy | Check logs: `docker logs volunteer-management-backend` |
| Blank frontend page | Wait 30s after start; check `docker logs volunteer-management-frontend` |
| PgAdmin won't start | Ensure `PGADMIN_DEFAULT_EMAIL` uses a valid domain (e.g. `admin@example.com`) |
| Reset all data | `docker compose down -v` then run `SETUP.bat` again (**deletes all data**) |

---

## Documentation

| Document | Path |
|----------|------|
| Software Design Document | [documentation/architecture/SDD.md](documentation/architecture/SDD.md) |
| API Contracts | [documentation/architecture/api-contracts.md](documentation/architecture/api-contracts.md) |
| UI Design System | [documentation/architecture/ui-design-system.md](documentation/architecture/ui-design-system.md) |
| Deployment Runbook | [documentation/runbooks/deployment.md](documentation/runbooks/deployment.md) |

---

## License

Proprietary — Panah Platform

**Developed by Investica Group**
