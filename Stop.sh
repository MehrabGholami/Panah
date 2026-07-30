#!/bin/bash
# Stop platform (volumes/data are preserved)
set -euo pipefail

cd "$(dirname "$0")"

echo ""
echo "  Stopping platform..."
echo ""

docker compose down

echo ""
echo "  Platform stopped."
echo "  (Data and volumes were preserved.)"
echo ""
echo "  To start again: ./Start.sh"
echo ""
