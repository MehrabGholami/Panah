from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from ops.domain.enums import BackupStatus, BackupTriggeredBy, BackupType


class BackupRun(BaseModel):
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=BackupStatus.choices(),
        default=BackupStatus.RUNNING,
        db_index=True,
    )
    backup_type = models.CharField(
        max_length=20,
        choices=BackupType.choices(),
        default=BackupType.FULL,
    )
    db_path = models.CharField(max_length=500, blank=True)
    media_path = models.CharField(max_length=500, blank=True)
    size_bytes = models.BigIntegerField(default=0)
    error_message = models.TextField(blank=True)
    triggered_by = models.CharField(
        max_length=20,
        choices=BackupTriggeredBy.choices(),
        default=BackupTriggeredBy.MANUAL,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="backup_runs",
    )

    class Meta:
        db_table = "ops_backup_run"
        ordering = ["-started_at"]
        verbose_name = "Backup run"
        verbose_name_plural = "Backup history"

    def __str__(self):
        return f"BackupRun {self.status} @ {self.started_at}"
