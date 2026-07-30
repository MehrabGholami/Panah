from __future__ import annotations

import logging

from celery import shared_task

from ops.domain.enums import BackupTriggeredBy

logger = logging.getLogger(__name__)


@shared_task(name="ops.tasks.run_daily_backup")
def run_daily_backup() -> str:
    from ops.application.services.backup_service import BackupService

    try:
        run = BackupService().run_full_backup(triggered_by=BackupTriggeredBy.SCHEDULE)
        return str(run.pk)
    except Exception:
        logger.exception("Scheduled daily backup failed.")
        raise


@shared_task(name="ops.tasks.run_manual_backup")
def run_manual_backup(actor_id: str | None = None) -> str:
    from accounts.models import User
    from ops.application.services.backup_service import BackupService

    actor = None
    if actor_id:
        actor = User.objects.filter(pk=actor_id).first()
    try:
        run = BackupService().run_full_backup(
            triggered_by=BackupTriggeredBy.MANUAL,
            actor=actor,
        )
        return str(run.pk)
    except Exception:
        logger.exception("Manual backup failed.")
        raise
