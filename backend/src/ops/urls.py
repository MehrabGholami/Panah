from django.urls import path

from ops.api.views.backup_views import (
    BackupRestoreView,
    BackupRunDetailView,
    BackupRunListView,
    BackupRunTriggerView,
    BackupSettingsView,
    BackupStatusView,
)

urlpatterns = [
    path("backups/", BackupRunListView.as_view(), name="ops-backup-list"),
    path("backups/status/", BackupStatusView.as_view(), name="ops-backup-status"),
    path("backups/settings/", BackupSettingsView.as_view(), name="ops-backup-settings"),
    path("backups/run/", BackupRunTriggerView.as_view(), name="ops-backup-run"),
    path("backups/<uuid:id>/restore/", BackupRestoreView.as_view(), name="ops-backup-restore"),
    path("backups/<uuid:id>/", BackupRunDetailView.as_view(), name="ops-backup-detail"),
]
