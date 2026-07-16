#!/bin/bash
set -euo pipefail

# First-time VPS setup for volunteer-management stack.
# Run as root or with sudo: sudo bash infrastructure/scripts/bootstrap.sh

APP_USER="${APP_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/volunteer-management}"
REPO_URL="${REPO_URL:-}"

log() { echo "[bootstrap] $*"; }

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo bash $0)" >&2
  exit 1
fi

log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

log "Installing dependencies..."
apt-get install -y -qq \
  ca-certificates \
  curl \
  git \
  ufw \
  fail2ban \
  unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  log "Docker Compose plugin not found; ensure Docker CE recent enough."
fi

log "Creating application user: ${APP_USER}"
if ! id "${APP_USER}" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "${APP_USER}"
fi
usermod -aG docker "${APP_USER}"

log "Creating application directories..."
mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/database/backups"
mkdir -p "${APP_DIR}/logs/nginx"
mkdir -p "${APP_DIR}/media"
mkdir -p "${APP_DIR}/static"
mkdir -p "${APP_DIR}/infrastructure/nginx/ssl"

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

if [[ -n "${REPO_URL}" && ! -d "${APP_DIR}/.git" ]]; then
  log "Cloning repository..."
  sudo -u "${APP_USER}" git clone "${REPO_URL}" "${APP_DIR}"
fi

log "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "Enabling unattended upgrades..."
dpkg-reconfigure -f noninteractive unattended-upgrades || true

cat <<EOF

Bootstrap complete.

Next steps:
  1. Copy environment file:
       cp ${APP_DIR}/environment/.env.production.example ${APP_DIR}/.env
  2. Edit ${APP_DIR}/.env with production secrets.
  3. For SSL, copy ssl.conf.example to ssl.conf and add certificates.
  4. Start the stack:
       cd ${APP_DIR}
       docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

EOF
