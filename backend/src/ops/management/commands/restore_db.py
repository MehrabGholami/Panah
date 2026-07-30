from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from ops.application.services.backup_service import BackupService


class Command(BaseCommand):
    help = (
        "Restore database (and optionally media) from a .sql.gz backup. "
        "Destructive — requires --confirm=<database_name> and --execute."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            type=str,
            default="",
            help="Must equal the database name to acknowledge restore intent.",
        )
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to a .sql.gz backup (absolute or under BACKUP_ROOT).",
        )
        parser.add_argument(
            "--media-file",
            type=str,
            default="",
            help="Optional media_*.tar.gz path (or auto-detected by timestamp).",
        )
        parser.add_argument(
            "--with-media",
            action="store_true",
            help="Also restore media archive.",
        )
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Actually perform the restore (without this flag, only prints plan).",
        )

    def handle(self, *args, **options):
        db_name = settings.DATABASES["default"]["NAME"]
        confirm = options["confirm"]
        backup_file = options["file"]
        media_file = options["media_file"] or None
        with_media = options["with_media"]
        execute = options["execute"]

        if confirm != db_name:
            raise CommandError(
                f"Refusing restore. Pass --confirm={db_name} to acknowledge intent."
            )

        root = BackupService().backup_root()
        self.stdout.write(f"Backup root: {root}")
        self.stdout.write(f"DB file: {backup_file}")
        if with_media:
            self.stdout.write(f"Media file: {media_file or '(auto-detect)'}")

        if not execute:
            self.stdout.write(self.style.WARNING("Dry-run only. Add --execute to run restore."))
            self.stdout.write(
                "Example:\n"
                f"  python manage.py restore_db --file={backup_file} "
                f"--confirm={db_name} --execute"
            )
            return

        result = BackupService().restore_database(
            backup_file,
            confirm_db_name=confirm,
            restore_media=with_media,
            media_file=media_file,
        )
        self.stdout.write(self.style.SUCCESS(result["message"]))
        self.stdout.write(f"Restored DB from: {result['db_file']}")
        if result.get("media_file"):
            self.stdout.write(f"Restored media from: {result['media_file']}")
        self.stdout.write("Recommended next steps:")
        self.stdout.write("  1) restart backend + celery + celery-beat")
        self.stdout.write("  2) python manage.py migrate")
