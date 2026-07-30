# پناه (Panah)

**Smart rescue and relief platform** for volunteer coordination during emergencies.

Developed by **Investica Group**.

---

## Security checklist (this repository)

| Check | Status |
|-------|--------|
| Production API keys / tokens hardcoded in source | **No** — none found |
| Real secrets committed to git | **No** — `.env` is gitignored |
| Dependencies reproducible | **Yes** — frontend `package-lock.json` + backend `requirements.lock` |
| Fresh-machine one-command setup | **Yes** — `SETUP.bat` / `./SETUP.sh` (not bare `docker compose up` alone) |
| Setup documented | **Yes** — this README |

> Development credentials (admin email/password, DB password) live only in `.env` / `.env.example` and seed helpers that **read the environment**. Change them before any shared, staging, or production use.

---

## Requirements

| Requirement | Version |
|-------------|---------|
| Docker Desktop (or Docker Engine + Compose V2) | Latest |
| OS | Windows 10/11, Ubuntu 24.04 LTS, or macOS |

No local Python, Node.js, or PostgreSQL install is required.

---

## One-command setup (fresh machine)

### Windows

1. Install and start **Docker Desktop**.
2. Clone/copy this repository to any path (no space-restriction).
3. Double-click **`SETUP.bat`** (or run `.\SETUP.ps1` in PowerShell).

`SETUP` will:

1. Create `.env` from `.env.example` if missing  
2. Create `logs/`, `media/`, `static/`, `database/backups/`  
3. Auto-pick free host ports if `80`/`443`/… are blocked (common on Windows)  
4. `docker compose build`  
5. `docker compose up -d`  
6. Wait for backend health, then run `seed_data` + `seed_demo`

### Linux / macOS

```bash
chmod +x SETUP.sh Start.sh Stop.sh
./SETUP.sh
```

### Equivalent manual flow

```bash
cp .env.example .env          # required once
docker compose up -d --build  # needs .env present
docker compose exec -T volunteer-management-backend python manage.py seed_data
docker compose exec -T volunteer-management-backend python manage.py seed_demo
```

> **Note:** `docker compose up` alone is **not** enough on a brand-new clone — `.env` must exist first. Prefer `SETUP.*`.

---

## Daily use

| Action | Windows | Linux / macOS |
|--------|---------|---------------|
| Start | `Start.bat` | `./Start.sh` |
| Stop | `Stop.bat` | `./Stop.sh` |

Data volumes are kept on stop. To wipe everything: `docker compose down -v` then run `SETUP` again.

---

## Access URLs

Ports come from `.env` (`HTTP_PORT`, `PGADMIN_PORT`, `MAILHOG_WEB_PORT`). Defaults:

| Service | Default URL |
|---------|-------------|
| App (Frontend via Nginx) | http://localhost |
| Login | http://localhost/login |
| API v1 | http://localhost/api/v1/ |
| Health | http://localhost/api/v1/health/ |
| Swagger UI | http://localhost/api/docs/ |
| OpenAPI schema | http://localhost/api/schema/ |
| Django Admin | http://localhost/django-admin/ |
| PgAdmin | http://localhost:5050 |
| Mailhog | http://localhost:8025 |

If SETUP remapped ports (e.g. `HTTP_PORT=8080`), use `http://localhost:8080` instead. The script prints the exact URLs at the end.

---

## Default development credentials

> **Local / demo only.** Override via `.env` before sharing the environment.

### Application admin (web login)

| Field | Value (from `.env.example`) |
|-------|-----------------------------|
| Email | `Investicaco@gmail.com` (`ADMIN_EMAIL`) |
| Password | `ADMIN` (`ADMIN_PASSWORD`) |
| Role | Admin |

### PgAdmin

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `admin` |

### PostgreSQL (inside Docker network)

| Field | Value |
|-------|-------|
| Host | `volunteer-management-postgres` |
| Port | `5432` (not published to host by default) |
| Database / User / Password | `volunteer_management` / `volunteer_user` / `volunteer_pass` |

---

## Environment files & secrets

| File | Tracked in git? | Purpose |
|------|-----------------|---------|
| `.env` | **No** (`.gitignore`) | Local runtime secrets |
| `.env.example` | Yes | Template — safe placeholders |
| `environment/.env.*.example` | Yes | Extra env templates |

Never commit real `SECRET_KEY`, production DB passwords, or third-party API keys.

Compose falls back to weak defaults only for local development (e.g. `${POSTGRES_PASSWORD:-volunteer_pass}`). Production must set strong values and use `docker-compose.prod.yml`.

---

## Dependency reproducibility

| Stack | Lock / pin mechanism | Install path |
|-------|----------------------|--------------|
| Frontend | `frontend/package-lock.json` | `npm ci` in `frontend/Dockerfile.dev` |
| Backend | `backend/requirements.lock` | `pip install -r requirements.lock` in Dockerfiles |

Top-level backend package ranges remain documented in `backend/pyproject.toml`. When changing dependencies, update both `pyproject.toml` and `requirements.lock`.

---

## User roles (seeded)

| Role | Slug | Scope |
|------|------|-------|
| Admin | `admin` | Full access |
| Coordinator | `coordinator` | Missions, applications, assignments |
| Volunteer | `volunteer` | Apply, accept assignments, report |

RBAC is database-driven (roles + permissions).

---

## Containers

| Container | Role |
|-----------|------|
| `volunteer-management-nginx` | Reverse proxy |
| `volunteer-management-frontend` | React (Vite) |
| `volunteer-management-backend` | Django REST API |
| `volunteer-management-celery` / `-beat` | Async + scheduled jobs |
| `volunteer-management-postgres` | PostgreSQL 17 |
| `volunteer-management-redis` | Cache / broker / JWT blacklist |
| `volunteer-management-pgadmin` | DB UI |
| `volunteer-management-mailhog` | Dev SMTP inbox |

---

## Common commands

```bash
docker compose ps
docker compose logs -f volunteer-management-backend
docker compose exec volunteer-management-backend python manage.py migrate
docker compose exec volunteer-management-backend python manage.py seed_data
docker compose exec volunteer-management-backend python manage.py seed_demo
docker compose down
docker compose up -d --build
```

Custom admin on seed:

```bash
docker compose exec volunteer-management-backend python manage.py seed_data \
  --admin-email you@example.com \
  --admin-password 'YourSecurePass123!'
```

---

## Project structure

```
├── SETUP.bat / Start.bat / Stop.bat
├── SETUP.sh  / Start.sh  / Stop.sh
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── backend/                  # Django API (+ requirements.lock)
├── frontend/                 # React + MUI (+ package-lock.json)
├── infrastructure/           # Nginx, Postgres init, scripts
├── documentation/            # SDD, ADRs, runbooks
└── environment/              # Extra env templates
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.13, Django 5.2, DRF, SimpleJWT, Celery |
| Frontend | React 19, Vite, MUI, Redux Toolkit, TanStack Query |
| Database | PostgreSQL 17 |
| Cache / Queue | Redis 7 |
| Proxy | Nginx |
| Runtime | Docker Compose |

---

## Production (high level)

```bash
cp environment/.env.production.example .env
# Set strong SECRET_KEY, DB password, ADMIN_*, email credentials
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

See [documentation/runbooks/deployment.md](documentation/runbooks/deployment.md).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Docker not running | Start Docker Desktop, re-run setup |
| `.env` missing | Run `SETUP` (copies from `.env.example`) |
| Port 80 / 443 forbidden or in use | `SETUP` auto-rewrites `HTTP_PORT` / `HTTPS_PORT` in `.env`, or set them manually |
| Backend unhealthy | `docker logs volunteer-management-backend` |
| Blank frontend | Wait ~30s; `docker logs volunteer-management-frontend` |
| Reset everything | `docker compose down -v` then `SETUP` again |

---

## Documentation

| Document | Path |
|----------|------|
| Software Design Document | [documentation/architecture/SDD.md](documentation/architecture/SDD.md) |
| API Contracts | [documentation/architecture/api-contracts.md](documentation/architecture/api-contracts.md) |
| Deployment Runbook | [documentation/runbooks/deployment.md](documentation/runbooks/deployment.md) |
| Phase DB design (P21) | [P21.md](P21.md) |
| Phase 3 architecture (P31) | [P31.md](P31.md) |

---

## License

Proprietary — Panah Platform  

**Developed by Investica Group**
