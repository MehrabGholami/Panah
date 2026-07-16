#!/bin/bash
set -euo pipefail

# Health check for volunteer-management Docker stack.
# Usage: bash infrastructure/scripts/healthcheck.sh
# Exit 0 if all checks pass, 1 otherwise.

NGINX_URL="${NGINX_URL:-http://localhost/health}"
BACKEND_URL="${BACKEND_URL:-http://localhost/api/v1/health/}"

CONTAINERS=(
  volunteer-management-postgres
  volunteer-management-redis
  volunteer-management-backend
  volunteer-management-frontend
  volunteer-management-nginx
)

FAILED=0

check_container() {
  local name="$1"
  if docker ps --format '{{.Names}}' | grep -qx "${name}"; then
    local status
    status="$(docker inspect --format='{{.State.Health.Status}}' "${name}" 2>/dev/null || echo "none")"
    if [[ "${status}" == "unhealthy" ]]; then
      echo "FAIL  ${name} (unhealthy)"
      FAILED=1
    elif [[ "${status}" == "healthy" || "${status}" == "none" ]]; then
      echo "OK    ${name}"
    else
      echo "WARN  ${name} (health: ${status})"
    fi
  else
    echo "FAIL  ${name} (not running)"
    FAILED=1
  fi
}

check_http() {
  local label="$1"
  local url="$2"
  if curl -fsS --max-time 5 "${url}" >/dev/null 2>&1; then
    echo "OK    ${label} (${url})"
  else
    echo "FAIL  ${label} (${url})"
    FAILED=1
  fi
}

echo "=== Container status ==="
for c in "${CONTAINERS[@]}"; do
  check_container "${c}"
done

echo ""
echo "=== HTTP endpoints ==="
check_http "nginx /health" "${NGINX_URL}"
check_http "backend /api/v1/health/" "${BACKEND_URL}"

echo ""
if [[ "${FAILED}" -eq 0 ]]; then
  echo "All health checks passed."
  exit 0
else
  echo "One or more health checks failed." >&2
  exit 1
fi
