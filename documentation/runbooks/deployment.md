# Deployment Runbook

## Prerequisites

- Ubuntu 24.04 LTS
- Docker Engine + Docker Compose V2
- Domain with DNS pointing to server

## First-Time Setup

```bash
git clone <repo-url> volunteer-management
cd volunteer-management
cp environment/.env.production.example .env
# Edit .env with production secrets

chmod +x infrastructure/scripts/*.sh
./infrastructure/scripts/bootstrap.sh
```

## SSL Configuration

```bash
cp infrastructure/nginx/conf.d/ssl.conf.example infrastructure/nginx/conf.d/ssl.conf
# Place certificates in infrastructure/nginx/ssl/
```

## Start Production Stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Database & Media Backup

### Primary path (Celery Beat)

Nightly full backup (DB `pg_dump` + `media/` archive) runs automatically at **02:00 Asia/Tehran** via Celery Beat (`ops.tasks.run_daily_backup`).

- Retention: **30 days** (NFR-015)
- Artifacts: `./database/backups/` (mounted as `/backups` in backend/celery)
- Status: Admin UI → **بکاپ و عملیات** (`/admin/ops`) or `GET /api/v1/ops/backups/status/`
- Health: `GET /api/v1/health/` includes `last_backup_status`, `last_backup_at`, `last_backup_age_hours`
- Manual trigger: Admin UI button, or

```bash
docker compose exec volunteer-management-backend python manage.py backup_now
```

Application logs are written to `./logs/django.log` (rotating) in addition to `docker logs`.

### Optional host cron (second layer)

```bash
0 2 * * * /path/to/infrastructure/scripts/backup-all.sh
```

Windows (dev):

```powershell
.\infrastructure\scripts\backup-db.ps1
```

## Health Check

```bash
./infrastructure/scripts/healthcheck.sh
```

## Restore Database (CLI only — no web restore)

Restore is intentionally **not** available from the admin UI.

```bash
./infrastructure/scripts/restore-db.sh database/backups/volunteer_management_YYYYMMDD_HHMMSS.sql.gz
```

Windows:

```powershell
.\infrastructure\scripts\restore-db.ps1 .\database\backups\volunteer_management_YYYYMMDD_HHMMSS.sql.gz
```

After restore, run migrations:

```bash
docker compose exec volunteer-management-backend python manage.py migrate
```

Media restore (if needed): extract the matching `media_*.tar.gz` into the project `media/` directory.

### Monthly restore drill checklist (NFR-016)

1. Pick the latest successful backup from `./database/backups/` or Ops UI history.
2. Restore into a **non-production** staging stack (or a temporary DB) using the CLI script.
3. Confirm app health (`/api/v1/health/`) and a sample login / mission list.
4. Record drill date, backup file name, duration, and result in the ops log.
5. Off-site / cloud copy of backups is a recommended next step (out of scope for this release).

## Update Deployment

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose exec volunteer-management-backend python manage.py migrate
docker compose exec volunteer-management-backend python manage.py seed_data
```

Re-seed permissions after upgrades so admin receives `ops.view_backups` / `ops.run_backup`.
