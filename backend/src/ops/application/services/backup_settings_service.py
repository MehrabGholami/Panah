from __future__ import annotations

import logging

from django.db import transaction

from common.exceptions.api_exceptions import ValidationError
from ops.domain.enums import BackupFrequency
from ops.models import BackupSettings

logger = logging.getLogger(__name__)

PERIODIC_TASK_NAME = "ops-scheduled-backup"
MIN_RETENTION_DAYS = 1
MAX_RETENTION_DAYS = 365
DEFAULT_RETENTION_DAYS = 30


class BackupSettingsService:
    def get_or_create(self) -> BackupSettings:
        settings_obj = BackupSettings.objects.order_by("created_at").first()
        if settings_obj:
            return settings_obj
        settings_obj = BackupSettings.objects.create(
            enabled=True,
            frequency=BackupFrequency.DAILY,
            hour=2,
            minute=0,
            weekday=0,
            day_of_month=1,
            retention_days=DEFAULT_RETENTION_DAYS,
        )
        self.sync_celery_schedule(settings_obj)
        return settings_obj

    def to_dict(self, settings_obj: BackupSettings | None = None) -> dict:
        obj = settings_obj or self.get_or_create()
        return {
            "enabled": obj.enabled,
            "frequency": str(obj.frequency),
            "hour": obj.hour,
            "minute": obj.minute,
            "weekday": obj.weekday,
            "day_of_month": obj.day_of_month,
            "retention_days": obj.retention_days,
            "schedule_summary": self.describe_schedule(obj),
        }

    def update(self, *, actor=None, **payload) -> BackupSettings:
        obj = self.get_or_create()
        data = {**self.to_dict(obj), **payload}

        enabled = bool(data.get("enabled", True))
        frequency = str(data.get("frequency") or BackupFrequency.DAILY)
        if frequency not in {f.value for f in BackupFrequency}:
            raise ValidationError("فرکانس بکاپ نامعتبر است.")

        hour = int(data.get("hour", 2))
        minute = int(data.get("minute", 0))
        weekday = int(data.get("weekday", 0))
        day_of_month = int(data.get("day_of_month", 1))
        retention_days = int(data.get("retention_days", DEFAULT_RETENTION_DAYS))

        if hour < 0 or hour > 23:
            raise ValidationError("ساعت باید بین ۰ تا ۲۳ باشد.")
        if minute < 0 or minute > 59:
            raise ValidationError("دقیقه باید بین ۰ تا ۵۹ باشد.")
        if weekday < 0 or weekday > 6:
            raise ValidationError("روز هفته باید بین ۰ (دوشنبه) تا ۶ (یکشنبه) باشد.")
        if day_of_month < 1 or day_of_month > 28:
            raise ValidationError("روز ماه باید بین ۱ تا ۲۸ باشد.")
        if retention_days < MIN_RETENTION_DAYS or retention_days > MAX_RETENTION_DAYS:
            raise ValidationError(
                f"مدت نگه‌داری باید بین {MIN_RETENTION_DAYS} تا {MAX_RETENTION_DAYS} روز باشد."
            )

        with transaction.atomic():
            obj.enabled = enabled
            obj.frequency = frequency
            obj.hour = hour
            obj.minute = minute
            obj.weekday = weekday
            obj.day_of_month = day_of_month
            obj.retention_days = retention_days
            obj.save(
                update_fields=[
                    "enabled",
                    "frequency",
                    "hour",
                    "minute",
                    "weekday",
                    "day_of_month",
                    "retention_days",
                    "updated_at",
                ]
            )
            self.sync_celery_schedule(obj)

        logger.info(
            "Backup settings updated by %s: enabled=%s frequency=%s retention=%s",
            getattr(actor, "email", None) or "system",
            obj.enabled,
            obj.frequency,
            obj.retention_days,
        )
        return obj

    def retention_days(self) -> int:
        return self.get_or_create().retention_days

    def describe_schedule(self, obj: BackupSettings) -> str:
        time_label = f"{obj.hour:02d}:{obj.minute:02d}"
        if not obj.enabled:
            return "غیرفعال"
        if obj.frequency == BackupFrequency.DAILY:
            return f"روزانه ساعت {time_label}"
        if obj.frequency == BackupFrequency.WEEKLY:
            weekdays = [
                "دوشنبه",
                "سه‌شنبه",
                "چهارشنبه",
                "پنجشنبه",
                "جمعه",
                "شنبه",
                "یکشنبه",
            ]
            return f"هفتگی ({weekdays[obj.weekday]}) ساعت {time_label}"
        return f"ماهانه (روز {obj.day_of_month}) ساعت {time_label}"

    def sync_celery_schedule(self, settings_obj: BackupSettings | None = None) -> None:
        obj = settings_obj or self.get_or_create()
        try:
            from django_celery_beat.models import CrontabSchedule, PeriodicTask
        except Exception:
            logger.exception("django_celery_beat unavailable; skip schedule sync.")
            return

        minute = str(obj.minute)
        hour = str(obj.hour)
        if obj.frequency == BackupFrequency.DAILY:
            day_of_week = "*"
            day_of_month = "*"
        elif obj.frequency == BackupFrequency.WEEKLY:
            # celery crontab: 0=Sunday … 6=Saturday; our weekday: 0=Monday … 6=Sunday
            celery_dow = str((obj.weekday + 1) % 7)
            day_of_week = celery_dow
            day_of_month = "*"
        else:
            day_of_week = "*"
            day_of_month = str(obj.day_of_month)

        schedule_defaults = {
            "minute": minute,
            "hour": hour,
            "day_of_week": day_of_week,
            "day_of_month": day_of_month,
            "month_of_year": "*",
        }
        # Newer django-celery-beat versions store timezone on CrontabSchedule.
        timezone_field_names = {f.name for f in CrontabSchedule._meta.fields}
        if "timezone" in timezone_field_names:
            schedule_defaults["timezone"] = "Asia/Tehran"

        schedule, _ = CrontabSchedule.objects.get_or_create(**schedule_defaults)
        PeriodicTask.objects.update_or_create(
            name=PERIODIC_TASK_NAME,
            defaults={
                "task": "ops.tasks.run_daily_backup",
                "crontab": schedule,
                "interval": None,
                "enabled": obj.enabled,
                "description": "Scheduled database/media backup (ops)",
            },
        )
