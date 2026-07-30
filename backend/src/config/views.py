from django.conf import settings
from django.core.cache import cache
from django.db import connection
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        db_ok = self._check_database()
        cache_ok = self._check_cache()
        healthy = db_ok and cache_ok
        payload = {
            "status": "ok" if healthy else "degraded",
            "database": "ok" if db_ok else "error",
            "cache": "ok" if cache_ok else "error",
            "version": getattr(settings, "SPECTACULAR_SETTINGS", {}).get("VERSION", "unknown"),
            **self._backup_health_fields(),
        }
        return Response(
            payload,
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    @staticmethod
    def _backup_health_fields():
        try:
            from ops.application.services.backup_service import BackupService

            summary = BackupService().get_status_summary()
            return {
                "last_backup_status": summary.get("last_backup_status"),
                "last_backup_at": summary.get("last_backup_at"),
                "last_backup_age_hours": summary.get("last_backup_age_hours"),
            }
        except Exception:
            return {
                "last_backup_status": None,
                "last_backup_at": None,
                "last_backup_age_hours": None,
            }

    @staticmethod
    def _check_database():
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return True
        except Exception:
            return False

    @staticmethod
    def _check_cache():
        try:
            cache.set("health_check", "1", timeout=5)
            return cache.get("health_check") == "1"
        except Exception:
            return False
