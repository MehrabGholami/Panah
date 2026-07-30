from django.core.management.base import BaseCommand

from ops.application.services.backup_service import BackupService
from ops.application.services.backup_settings_service import BackupSettingsService


class Command(BaseCommand):
    help = "Prune backup files and BackupRun rows older than retention period."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=None,
            help="Retention days (default: value from BackupSettings).",
        )

    def handle(self, *args, **options):
        days = options["days"]
        if days is None:
            days = BackupSettingsService().retention_days()
        result = BackupService().prune_old_backups(retention_days=days)
        self.stdout.write(
            self.style.SUCCESS(
                f"Pruned files={result['removed_files']} rows={result['removed_rows']} "
                f"(retention_days={days})"
            )
        )
