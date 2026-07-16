# Software Design Document

See the full architecture specification in the project plan. This document summarizes the implemented system.

## Overview

Panah Platform — modular monolith for smart rescue and relief volunteer coordination.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.13, Django 5.2, DRF, SimpleJWT, Celery |
| Frontend | React 19, Vite, MUI v6, Redux Toolkit, TanStack Query |
| Database | PostgreSQL 17 |
| Cache/Queue | Redis 7 |
| Proxy | Nginx |
| Containers | Docker Compose |

## Domain Apps

- `authentication` — JWT login/logout/refresh
- `accounts` — User, Role, Permission (dynamic RBAC)
- `volunteers` — Registration, approval workflow
- `skills` — Skill catalog, volunteer skills
- `disasters` — Disaster incidents
- `missions` — Mission lifecycle
- `assignments` — Volunteer-mission matching
- `reports` — Post-mission reports
- `notifications` — In-app + email (Celery)
- `dashboard` — Aggregated stats (Redis cached)
- `audit_logs` — Immutable audit trail

## Clean Architecture (per app)

```
api/ → application/services/ → infrastructure/repositories/ → models/
```

## API Versioning

All endpoints under `/api/v1/`. OpenAPI at `/api/docs/`.

## UI

Persian RTL, dark-first theme. See [ui-design-system.md](ui-design-system.md).

## Deployment

Docker Compose on Ubuntu 24.04 LTS. See [deployment.md](deployment.md).
