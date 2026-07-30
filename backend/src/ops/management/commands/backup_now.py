from django.core.management.base import BaseCommand

from ops.application.services.backup_service import BackupService
from ops.domain.enums import BackupTriggeredBy


class Command(BaseCommand):
    help = "Run a full database + media backup now."

    def add_arguments(self, parser):
        parser.add_argument(
            "--db-only",
            action="store_true",
            help="Backup database only.",
        )
        parser.add_argument(
            "--media-only",
            action="store_true",
            help="Backup media only.",
        )

    def handle(self, *args, **options):
        include_db = not options["media_only"]
        include_media = not options["db_only"]
        if options["db_only"] and options["media_only"]:
            self.stderr.write("Use only one of --db-only or --media-only.")
            return

        run = BackupService().run_full_backup(
            triggered_by=BackupTriggeredBy.CLI,
            include_db=include_db,
            include_media=include_media,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Backup {run.status}: id={run.pk} size={run.size_bytes} bytes"
            )
        )
