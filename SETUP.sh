#!/bin/bash
# Initial setup — Ubuntu / Linux
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

step "Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
    err "Docker is not installed."
    echo "Install: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    err "Docker is not running."
    echo "sudo systemctl start docker"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    err "Docker Compose V2 not found."
    exit 1
fi
ok "Docker is ready."

step "Preparing .env..."
if [[ ! -f .env ]]; then
    cp .env.example .env
    ok ".env created from .env.example."
else
    warn ".env already exists — left unchanged."
fi

step "Creating data directories..."
mkdir -p logs/nginx media static database/backups

get_env() {
    local name="$1" default="$2"
    local val
    val=$(grep -E "^${name}=" .env 2>/dev/null | tail -n1 | cut -d'=' -f2-)
    echo "${val:-$default}"
}

set_env() {
    local name="$1" value="$2"
    if grep -qE "^${name}=" .env 2>/dev/null; then
        sed -i.bak "s/^${name}=.*/${name}=${value}/" .env && rm -f .env.bak
    else
        echo "${name}=${value}" >> .env
    fi
}

port_free() {
    ! (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

resolve_free_port() {
    local name="$1" fallback="$2"
    local current
    current=$(get_env "$name" "$fallback")
    if port_free "$current"; then
        echo "$current"
        return
    fi
    warn "Port $current ($name) is not available."
    local candidate=$current
    for i in $(seq 1 50); do
        candidate=$((current < 1000 ? current + 100 + i : current + i))
        if port_free "$candidate"; then
            set_env "$name" "$candidate"
            ok "  -> $name auto-changed to $candidate."
            echo "$candidate"
            return
        fi
    done
    err "  -> No free port found for $name; set it manually in .env."
    echo "$current"
}

step "Checking host ports..."
HTTP_PORT_RESOLVED=$(resolve_free_port "HTTP_PORT" 80)
resolve_free_port "HTTPS_PORT" 443 >/dev/null
PGADMIN_PORT_RESOLVED=$(resolve_free_port "PGADMIN_PORT" 5050)
MAILHOG_WEB_PORT_RESOLVED=$(resolve_free_port "MAILHOG_WEB_PORT" 8025)
resolve_free_port "MAILHOG_SMTP_PORT" 1025 >/dev/null
ok "Ports are ready."

step "Building images..."
docker compose build

step "Starting services..."
docker compose up -d

step "Waiting for backend..."
for i in $(seq 1 24); do
    status=$(docker inspect --format='{{.State.Health.Status}}' volunteer-management-backend 2>/dev/null || echo "starting")
    if [[ "$status" == "healthy" ]]; then
        ok "Backend is ready."
        break
    fi
    sleep 5
    echo "  ... waiting ($((i * 5)) s)"
done

step "Loading seed data..."
docker compose exec -T volunteer-management-backend python manage.py seed_data || true
docker compose exec -T volunteer-management-backend python manage.py seed_demo || true

echo ""
ok "  ========================================="
ok "   Setup completed successfully!"
ok "  ========================================="
echo ""
echo "  App:           http://localhost:${HTTP_PORT_RESOLVED}"
echo "  API Docs:      http://localhost:${HTTP_PORT_RESOLVED}/api/docs/"
echo "  PgAdmin:       http://localhost:${PGADMIN_PORT_RESOLVED}"
echo "  Mailhog:       http://localhost:${MAILHOG_WEB_PORT_RESOLVED}"
echo ""
ADMIN_EMAIL_RESOLVED=$(get_env "ADMIN_EMAIL" "InvesticaCO@gmail.com")
ADMIN_PASSWORD_RESOLVED=$(get_env "ADMIN_PASSWORD" "(see .env ADMIN_PASSWORD)")
echo "  Admin email:   ${ADMIN_EMAIL_RESOLVED}"
echo "  Password:      ${ADMIN_PASSWORD_RESOLVED}"
echo "  (Development-only credentials from .env — change before any shared/staging use.)"
echo ""
echo "  Start:  ./Start.sh"
echo "  Stop:   ./Stop.sh"
echo ""
