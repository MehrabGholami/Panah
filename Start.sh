#!/bin/bash
# اجرای سامانه
set -euo pipefail

cd "$(dirname "$0")"

echo ""
echo "  در حال اجرای سامانه..."
echo ""

if ! docker info >/dev/null 2>&1; then
    echo "خطا: Docker در حال اجرا نیست."
    exit 1
fi

if [[ ! -f .env ]]; then
    echo "فایل .env یافت نشد. ابتدا ./SETUP.sh را اجرا کنید."
    exit 1
fi

docker compose up -d

echo ""
echo "  سامانه در حال اجراست."
echo "  برنامه: http://localhost"
echo ""
docker compose ps
