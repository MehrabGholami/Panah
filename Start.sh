#!/bin/bash
# Start platform
set -euo pipefail

cd "$(dirname "$0")"

echo ""
echo "  Starting platform..."
echo ""

if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running."
    exit 1
fi

if [[ ! -f .env ]]; then
    echo ".env not found. Run ./SETUP.sh first."
    exit 1
fi

HTTP_PORT_RESOLVED=$(grep -E "^HTTP_PORT=" .env 2>/dev/null | tail -n1 | cut -d'=' -f2-)
HTTP_PORT_RESOLVED="${HTTP_PORT_RESOLVED:-80}"

if ! docker compose up -d; then
    echo ""
    echo "Start failed. If you see 'port is already allocated' or 'forbidden by its access permissions':"
    echo "  Change HTTP_PORT (and HTTPS_PORT / PGADMIN_PORT / MAILHOG_* if needed) in .env to a free port, then retry."
    exit 1
fi

echo ""
echo "  Platform is running."
echo "  App: http://localhost:${HTTP_PORT_RESOLVED}"
echo ""
docker compose ps
