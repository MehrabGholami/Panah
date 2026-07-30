#!/bin/bash
set -euo pipefail

# Backup PostgreSQL database to database/backups/
# Usage: bash infrastructure/scripts/backup-db.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/database/backups"

CONTAINER="${POSTGRES_CONTAINER:-volunteer-management-postgres}"
DB_NAME="${POSTGRES_DB:-volunteer_management}"
DB_USER="${POSTGRES_USER:-volunteer_user}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER}"; then
  echo "Error: container '${CONTAINER}' is not running." >&2
  exit 1
fi

echo "Backing up ${DB_NAME} from ${CONTAINER}..."
docker exec -t "${CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-acl \
  | gzip > "${BACKUP_FILE}"

echo "Backup saved: ${BACKUP_FILE}"

# Keep backups from the last RETENTION_DAYS days
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
