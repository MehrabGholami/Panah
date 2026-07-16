# Deployment Architecture

## Development

```
Browser → nginx:80 → /api/* → backend:8000
                  → /*     → frontend:5173 (Vite)
```

## Production

```
Internet → UFW(80,443) → nginx (SSL)
         → /api/*     → gunicorn backend:8000
         → /*         → frontend static
         → /media/*   → volume mount
```

## Containers

All containers prefixed `volunteer-management-`.

## Volumes

- `volunteer-management-postgres-data`
- `volunteer-management-redis-data`
- Host: `./media`, `./static`, `./logs`, `./database/backups`
