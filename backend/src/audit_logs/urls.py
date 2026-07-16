from django.urls import path

from audit_logs.api.views.audit_views import AuditLogListView

urlpatterns = [
    path("", AuditLogListView.as_view(), name="audit-log-list"),
]
