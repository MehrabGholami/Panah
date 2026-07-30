#!/bin/bash
set -euo pipefail

# Restore PostgreSQL database from a backup file.
# Usage: bash infrastructure/scripts/restore-db.sh [backup_file.sql.gz]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/database/backups"

CONTAINER="${POSTGRES_CONTAINER:-volunteer-management-postgres}"
DB_NAME="${POSTGRES_DB:-volunteer_management}"
DB_USER="${POSTGRES_USER:-volunteer_user}"

BACKUP_FILE="${1:-}"

if [[ -z "${BACKUP_FILE}" ]]; then
  echo "Available backups:"
  ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "  (none found)"
  echo ""
  echo "Usage: $0 <backup_file.sql.gz>" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Error: backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER}"; then
  echo "Error: container '${CONTAINER}' is not running." >&2
  exit 1
fi

echo "WARNING: This will replace all data in database '${DB_NAME}'."
read -r -p "Type '${DB_NAME}' to confirm: " CONFIRM

if [[ "${CONFIRM}" != "${DB_NAME}" ]]; then
  echo "Aborted."
  exit 1
fi

echo "Terminating active connections..."
docker exec -t "${CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
  >/dev/null 2>&1 || true

echo "Dropping and recreating database..."
docker exec -t "${CONTAINER}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"
docker exec -t "${CONTAINER}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"

echo "Restoring from ${BACKUP_FILE}..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "Restore complete."
echo "Next: run migrations if schema drift is possible:"
echo "  docker compose exec volunteer-management-backend python manage.py migrate"
