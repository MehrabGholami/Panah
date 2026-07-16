#!/bin/bash
# راه‌اندازی اولیه — Ubuntu / Linux
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${CYAN}==> $*${NC}"; }
ok()   { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
err()  { echo -e "${RED}$*${NC}"; }

echo ""
echo "  ========================================="
echo "   Panah Platform - SETUP"
echo "  ========================================="
echo ""

step "بررسی Docker..."
if ! command -v docker >/dev/null 2>&1; then
    err "Docker نصب نیست."
    echo "نصب: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    err "Docker در حال اجرا نیست."
    echo "sudo systemctl start docker"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    err "Docker Compose V2 یافت نشد."
    exit 1
fi
ok "Docker آماده است."

step "تنظیم فایل محیط (.env)..."
if [[ ! -f .env ]]; then
    cp .env.example .env
    ok "فایل .env ساخته شد."
else
    warn "فایل .env از قبل وجود دارد."
fi

step "ایجاد پوشه‌های داده..."
mkdir -p logs/nginx media static database/backups

step "ساخت imageها..."
docker compose build

step "اجرای سرویس‌ها..."
docker compose up -d

step "انتظار برای backend..."
for i in $(seq 1 24); do
    status=$(docker inspect --format='{{.State.Health.Status}}' volunteer-management-backend 2>/dev/null || echo "starting")
    if [[ "$status" == "healthy" ]]; then
        ok "Backend آماده است."
        break
    fi
    sleep 5
    echo "  ... در حال انتظار ($((i * 5)) ثانیه)"
done

step "بارگذاری داده‌های اولیه..."
docker compose exec -T volunteer-management-backend python manage.py seed_data || true
docker compose exec -T volunteer-management-backend python manage.py seed_demo || true

echo ""
ok "  ========================================="
ok "   راه‌اندازی با موفقیت انجام شد!"
ok "  ========================================="
echo ""
echo "  برنامه:        http://localhost"
echo "  API Docs:      http://localhost/api/docs/"
echo "  PgAdmin:       http://localhost:5050"
echo "  Mailhog:       http://localhost:8025"
echo ""
echo "  Admin email:   InvesticaCO@gmail.com"
echo "  Password:      Investica003"
echo ""
echo "  اجرا:  ./Start.sh"
echo "  توقف:  ./Stop.sh"
echo ""
