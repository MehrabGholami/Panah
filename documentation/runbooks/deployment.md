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

## Database Backup (cron daily)

```bash
0 2 * * * /path/to/infrastructure/scripts/backup-db.sh
```

## Health Check

```bash
./infrastructure/scripts/healthcheck.sh
```

## Restore Database

```bash
./infrastructure/scripts/restore-db.sh database/backups/volunteer_management_YYYYMMDD.sql.gz
```

## Update Deployment

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose exec volunteer-management-backend python manage.py migrate
```
