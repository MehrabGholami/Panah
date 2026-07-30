#!/bin/bash
set -euo pipefail

# Backup media/ directory to database/backups/
# Usage: bash infrastructure/scripts/backup-media.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/database/backups"
MEDIA_DIR="${PROJECT_ROOT}/media"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/media_${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"
mkdir -p "${MEDIA_DIR}"

echo "Archiving media from ${MEDIA_DIR}..."
tar -czf "${BACKUP_FILE}" -C "${PROJECT_ROOT}" media

echo "Media backup saved: ${BACKUP_FILE}"
find "${BACKUP_DIR}" -name "media_*.tar.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
