#!/bin/bash
# توقف سامانه (داده‌ها حفظ می‌شوند)
set -euo pipefail

cd "$(dirname "$0")"

echo ""
echo "  در حال توقف سامانه..."
echo ""

docker compose down

echo ""
echo "  سامانه متوقف شد."
echo "  (داده‌ها و volumeها حفظ شده‌اند)"
echo ""
echo "  برای اجرای مجدد: ./Start.sh"
echo ""
