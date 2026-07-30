from django.db import models

from common.models.base_model import BaseModel
from ops.domain.enums import BackupFrequency


class BackupSettings(BaseModel):
    """Singleton row for automatic backup schedule and retention."""

    enabled = models.BooleanField(default=True, verbose_name="Enabled")
    frequency = models.CharField(
        max_length=20,
        choices=BackupFrequency.choices(),
        default=BackupFrequency.DAILY,
        verbose_name="Frequency",
    )
    hour = models.PositiveSmallIntegerField(default=2, verbose_name="Hour")
    minute = models.PositiveSmallIntegerField(default=0, verbose_name="Minute")
    weekday = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Weekday",
        help_text="0=Monday … 6=Sunday (for weekly backups)",
    )
    day_of_month = models.PositiveSmallIntegerField(
        default=1,
        verbose_name="Day of month",
        help_text="1–28 (for monthly backups)",
    )
    retention_days = models.PositiveIntegerField(default=30, verbose_name="Retention (days)")

    class Meta:
        db_table = "ops_backup_settings"
        verbose_name = "Backup settings"
        verbose_name_plural = "Backup settings"

    def __str__(self):
        return f"BackupSettings(enabled={self.enabled}, frequency={self.frequency})"
