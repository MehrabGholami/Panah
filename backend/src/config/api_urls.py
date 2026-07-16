from django.urls import include, path

from config.views import HealthCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="api-health-check"),
    path("auth/", include("authentication.urls")),
    path("accounts/", include("accounts.urls")),
    path("volunteers/", include("volunteers.urls")),
    path("skills/", include("skills.urls")),
    path("disasters/", include("disasters.urls")),
    path("missions/", include("missions.urls")),
    path("assignments/", include("assignments.urls")),
    path("reports/", include("reports.urls")),
    path("notifications/", include("notifications.urls")),
    path("dashboard/", include("dashboard.urls")),
    path("audit-logs/", include("audit_logs.urls")),
    path("tickets/", include("tickets.urls")),
]
