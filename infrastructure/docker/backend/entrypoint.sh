#!/bin/bash
set -e

export PYTHONPATH=/app/src

echo "Waiting for PostgreSQL..."
while ! python -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('${POSTGRES_HOST:-volunteer-management-postgres}', ${POSTGRES_PORT:-5432}))" 2>/dev/null; do
  sleep 1
done

python manage.py migrate --noinput
python manage.py collectstatic --noinput 2>/dev/null || true
python manage.py seed_data 2>/dev/null || true

exec "$@"
