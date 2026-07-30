#!/bin/bash
set -euo pipefail

# Full backup: database + media (host-side companion to Celery Beat backups)
# Usage: bash infrastructure/scripts/backup-all.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/backup-db.sh"
bash "${SCRIPT_DIR}/backup-media.sh"

echo "Full backup complete."
