from __future__ import annotations

import gzip
import json
import logging
import os
import subprocess
import tarfile
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.utils import timezone

from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from common.exceptions.api_exceptions import ValidationError
from ops.domain.enums import BackupStatus, BackupTriggeredBy, BackupType
from ops.models import BackupRun

logger = logging.getLogger(__name__)

RETENTION_DAYS = 30
LATEST_STATUS_FILENAME = "latest.json"


class BackupService:
    def backup_root(self) -> Path:
        root = Path(getattr(settings, "BACKUP_ROOT", "/backups"))
        root.mkdir(parents=True, exist_ok=True)
        return root

    def _retention_days(self) -> int:
        try:
            from ops.application.services.backup_settings_service import BackupSettingsService

            return BackupSettingsService().retention_days()
        except Exception:
            return RETENTION_DAYS

    def run_full_backup(
        self,
        *,
        triggered_by: str = BackupTriggeredBy.MANUAL,
        actor=None,
        include_db: bool = True,
        include_media: bool = True,
    ) -> BackupRun:
        if not include_db and not include_media:
            raise ValidationError("At least one of database or media backup is required.")

        backup_type = BackupType.FULL
        if include_db and not include_media:
            backup_type = BackupType.DB
        elif include_media and not include_db:
            backup_type = BackupType.MEDIA

        run = BackupRun.objects.create(
            status=BackupStatus.RUNNING,
            backup_type=backup_type,
            triggered_by=triggered_by,
            actor=actor,
        )
        AuditService().log(
            action=AuditAction.CREATE,
            resource_type="backup_run",
            resource_id=run.pk,
            user_id=getattr(actor, "pk", None),
            metadata={"triggered_by": triggered_by, "phase": "started"},
        )

        stamp = timezone.localtime().strftime("%Y%m%d_%H%M%S")
        root = self.backup_root()
        db_path = ""
        media_path = ""
        total_size = 0

        try:
            if include_db:
                db_file = root / f"{settings.DATABASES['default']['NAME']}_{stamp}.sql.gz"
                self._dump_database(db_file)
                db_path = str(db_file)
                total_size += db_file.stat().st_size

            if include_media:
                media_file = root / f"media_{stamp}.tar.gz"
                self._archive_media(media_file)
                media_path = str(media_file)
                if media_file.exists():
                    total_size += media_file.stat().st_size

            run.status = BackupStatus.SUCCESS
            run.finished_at = timezone.now()
            run.db_path = db_path
            run.media_path = media_path
            run.size_bytes = total_size
            run.error_message = ""
            run.save(
                update_fields=[
                    "status",
                    "finished_at",
                    "db_path",
                    "media_path",
                    "size_bytes",
                    "error_message",
                    "updated_at",
                ]
            )
            self._write_latest_status(run)
            self.prune_old_backups()
            AuditService().log(
                action=AuditAction.UPDATE,
                resource_type="backup_run",
                resource_id=run.pk,
                user_id=getattr(actor, "pk", None),
                metadata={
                    "triggered_by": triggered_by,
                    "phase": "success",
                    "size_bytes": total_size,
                },
            )
            return run
        except Exception as exc:
            logger.exception("Backup failed: %s", exc)
            run.status = BackupStatus.FAILED
            run.finished_at = timezone.now()
            run.db_path = db_path
            run.media_path = media_path
            run.size_bytes = total_size
            run.error_message = str(exc)[:4000]
            run.save(
                update_fields=[
                    "status",
                    "finished_at",
                    "db_path",
                    "media_path",
                    "size_bytes",
                    "error_message",
                    "updated_at",
                ]
            )
            self._write_latest_status(run)
            AuditService().log(
                action=AuditAction.UPDATE,
                resource_type="backup_run",
                resource_id=run.pk,
                user_id=getattr(actor, "pk", None),
                metadata={
                    "triggered_by": triggered_by,
                    "phase": "failed",
                    "error": run.error_message[:500],
                },
            )
            if triggered_by == BackupTriggeredBy.SCHEDULE:
                self._notify_admins_failure(run)
            raise

    def prune_old_backups(self, retention_days: int | None = None) -> dict:
        if retention_days is None:
            retention_days = self._retention_days()
        root = self.backup_root()
        cutoff = timezone.now() - timedelta(days=retention_days)
        removed_files = 0

        for pattern in ("*.sql.gz", "media_*.tar.gz"):
            for path in root.glob(pattern):
                try:
                    mtime = datetime.fromtimestamp(
                        path.stat().st_mtime, tz=timezone.get_current_timezone()
                    )
                except OSError:
                    continue
                if mtime < cutoff:
                    try:
                        path.unlink(missing_ok=True)
                        removed_files += 1
                    except OSError:
                        logger.warning("Could not remove old backup file %s", path)

        removed_rows, _ = BackupRun.all_objects.filter(started_at__lt=cutoff).delete()
        return {"removed_files": removed_files, "removed_rows": removed_rows}

    def get_status_summary(self) -> dict:
        latest_success = (
            BackupRun.objects.filter(status=BackupStatus.SUCCESS)
            .order_by("-finished_at", "-started_at")
            .first()
        )
        latest_any = BackupRun.objects.order_by("-started_at").first()
        age_hours = None
        if latest_success and latest_success.finished_at:
            age_hours = round(
                (timezone.now() - latest_success.finished_at).total_seconds() / 3600,
                2,
            )
        return {
            "last_backup_status": latest_any.status if latest_any else None,
            "last_backup_at": (
                latest_success.finished_at.isoformat()
                if latest_success and latest_success.finished_at
                else None
            ),
            "last_backup_age_hours": age_hours,
            "last_backup_size_bytes": latest_success.size_bytes if latest_success else 0,
            "last_run_id": str(latest_any.pk) if latest_any else None,
            "last_run_error": (
                latest_any.error_message
                if latest_any and latest_any.status == BackupStatus.FAILED
                else ""
            ),
            "retention_days": self._retention_days(),
            "database_name": str(settings.DATABASES["default"].get("NAME") or ""),
            "schedule": self._schedule_summary(),
        }

    def _schedule_summary(self) -> dict:
        try:
            from ops.application.services.backup_settings_service import BackupSettingsService

            return BackupSettingsService().to_dict()
        except Exception:
            return {
                "enabled": True,
                "frequency": "daily",
                "hour": 2,
                "minute": 0,
                "weekday": 0,
                "day_of_month": 1,
                "retention_days": RETENTION_DAYS,
                "schedule_summary": "روزانه ساعت 02:00",
            }

    def restore_database(
        self,
        backup_file: str | Path,
        *,
        confirm_db_name: str,
        actor=None,
        restore_media: bool = False,
        media_file: str | Path | None = None,
    ) -> dict:
        """
        Destructive restore of PostgreSQL (and optionally media) from backup files.

        Requires confirm_db_name to equal the configured database name.
        After restore, Django DB connections are closed; restart backend/celery is recommended.
        """
        from django.db import connections

        db = settings.DATABASES["default"]
        db_name = str(db.get("NAME") or "")
        if not confirm_db_name or confirm_db_name != db_name:
            raise ValidationError(
                f"برای تأیید ری‌استور باید نام دیتابیس را دقیقاً وارد کنید: {db_name}"
            )

        sql_path = Path(backup_file)
        if not sql_path.is_absolute():
            sql_path = self.backup_root() / sql_path
        if not sql_path.exists():
            raise ValidationError(f"فایل بکاپ یافت نشد: {sql_path}")
        if not str(sql_path).endswith(".sql.gz"):
            raise ValidationError("فقط فایل‌های .sql.gz پشتیبانی می‌شوند.")

        media_path: Path | None = None
        if restore_media:
            if media_file:
                media_path = Path(media_file)
                if not media_path.is_absolute():
                    media_path = self.backup_root() / media_path
            else:
                tokens = sql_path.name.replace(".sql.gz", "").split("_")
                if len(tokens) >= 2:
                    stamp_tail = "_".join(tokens[-2:])
                    candidate = self.backup_root() / f"media_{stamp_tail}.tar.gz"
                    if candidate.exists():
                        media_path = candidate
            if media_path is None or not media_path.exists():
                raise ValidationError(
                    "فایل media برای ری‌استور یافت نشد. مسیر media_*.tar.gz را مشخص کنید."
                )

        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="backup_restore",
            resource_id="",
            user_id=getattr(actor, "pk", None),
            metadata={
                "phase": "started",
                "db_file": str(sql_path),
                "media_file": str(media_path) if media_path else "",
            },
        )

        connections.close_all()
        try:
            self._recreate_database(db_name)
            self._restore_sql_gz(sql_path, db_name)
            if media_path:
                self._restore_media_archive(media_path)
        except Exception as exc:
            logger.exception("Restore failed: %s", exc)
            AuditService().log(
                action=AuditAction.UPDATE,
                resource_type="backup_restore",
                resource_id="",
                user_id=getattr(actor, "pk", None),
                metadata={"phase": "failed", "error": str(exc)[:500]},
            )
            raise

        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="backup_restore",
            resource_id="",
            user_id=getattr(actor, "pk", None),
            metadata={
                "phase": "success",
                "db_file": str(sql_path),
                "media_file": str(media_path) if media_path else "",
            },
        )
        connections.close_all()
        return {
            "database": db_name,
            "db_file": str(sql_path),
            "media_file": str(media_path) if media_path else "",
            "message": (
                "ری‌استور انجام شد. سرویس‌های backend و celery را restart کنید "
                "و در صورت نیاز migrate را اجرا کنید."
            ),
        }

    def _db_env(self) -> tuple[dict, dict]:
        db = settings.DATABASES["default"]
        env = os.environ.copy()
        env["PGPASSWORD"] = str(db.get("PASSWORD") or "")
        return env, db

    def _psql_base_cmd(self, database: str) -> list[str]:
        _, db = self._db_env()
        return [
            "psql",
            "-h",
            str(db.get("HOST") or "localhost"),
            "-p",
            str(db.get("PORT") or "5432"),
            "-U",
            str(db.get("USER") or "postgres"),
            "-d",
            database,
            "-v",
            "ON_ERROR_STOP=1",
        ]

    def _recreate_database(self, db_name: str) -> None:
        env, db = self._db_env()
        maintenance_db = os.environ.get("POSTGRES_MAINTENANCE_DB", "postgres")
        user = str(db.get("USER") or "postgres")
        terminate_sql = (
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            f"WHERE datname = '{db_name}' AND pid <> pg_backend_pid();"
        )
        commands = [
            terminate_sql,
            f'DROP DATABASE IF EXISTS "{db_name}";',
            f'CREATE DATABASE "{db_name}" OWNER "{user}";',
        ]
        for sql in commands:
            try:
                subprocess.run(
                    self._psql_base_cmd(maintenance_db) + ["-c", sql],
                    check=True,
                    capture_output=True,
                    env=env,
                )
            except FileNotFoundError as exc:
                raise RuntimeError(
                    "psql not found. Install postgresql-client in the container image."
                ) from exc
            except subprocess.CalledProcessError as exc:
                stderr = (exc.stderr or b"").decode("utf-8", errors="replace")
                # terminate may return nothing useful; drop/create must succeed
                if "DROP DATABASE" in sql or "CREATE DATABASE" in sql:
                    raise RuntimeError(f"Database recreate failed: {stderr.strip() or exc}") from exc
                logger.warning("psql warning during recreate step: %s", stderr.strip())

    def _restore_sql_gz(self, sql_path: Path, db_name: str) -> None:
        env, _ = self._db_env()
        try:
            with gzip.open(sql_path, "rb") as handle:
                process = subprocess.run(
                    self._psql_base_cmd(db_name),
                    check=True,
                    capture_output=True,
                    env=env,
                    input=handle.read(),
                )
        except FileNotFoundError as exc:
            raise RuntimeError(
                "psql not found. Install postgresql-client in the container image."
            ) from exc
        except subprocess.CalledProcessError as exc:
            stderr = (exc.stderr or b"").decode("utf-8", errors="replace")
            raise RuntimeError(f"Restore failed: {stderr.strip() or exc}") from exc
        if process.stderr:
            logger.info(
                "psql restore stderr: %s",
                process.stderr.decode("utf-8", errors="replace")[:1000],
            )

    def _restore_media_archive(self, media_path: Path) -> None:
        media_root = Path(settings.MEDIA_ROOT)
        parent = media_root.parent
        parent.mkdir(parents=True, exist_ok=True)
        # Extract archive which stores files under arcname "media"
        with tarfile.open(media_path, "r:gz") as archive:
            # Safety: only extract under media/
            for member in archive.getmembers():
                member_path = Path(member.name)
                if member_path.is_absolute() or ".." in member_path.parts:
                    raise RuntimeError(f"Unsafe path in media archive: {member.name}")
            archive.extractall(path=str(parent))

    def _dump_database(self, target: Path) -> None:
        db = settings.DATABASES["default"]
        env = os.environ.copy()
        env["PGPASSWORD"] = str(db.get("PASSWORD") or "")
        cmd = [
            "pg_dump",
            "-h",
            str(db.get("HOST") or "localhost"),
            "-p",
            str(db.get("PORT") or "5432"),
            "-U",
            str(db.get("USER") or "postgres"),
            "-d",
            str(db.get("NAME") or "postgres"),
            "--no-owner",
            "--no-acl",
        ]
        try:
            process = subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                env=env,
            )
        except FileNotFoundError as exc:
            raise RuntimeError(
                "pg_dump not found. Install postgresql-client in the container image."
            ) from exc
        except subprocess.CalledProcessError as exc:
            stderr = (exc.stderr or b"").decode("utf-8", errors="replace")
            raise RuntimeError(f"pg_dump failed: {stderr.strip() or exc}") from exc

        with gzip.open(target, "wb") as handle:
            handle.write(process.stdout)

    def _archive_media(self, target: Path) -> None:
        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.exists():
            media_root.mkdir(parents=True, exist_ok=True)
        with tarfile.open(target, "w:gz") as archive:
            archive.add(str(media_root), arcname="media")

    def _write_latest_status(self, run: BackupRun) -> None:
        payload = {
            "id": str(run.pk),
            "status": run.status,
            "finished_at": run.finished_at.isoformat() if run.finished_at else None,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "size_bytes": run.size_bytes,
            "backup_type": run.backup_type,
            "error_message": run.error_message[:500] if run.error_message else "",
        }
        path = self.backup_root() / LATEST_STATUS_FILENAME
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _notify_admins_failure(self, run: BackupRun) -> None:
        try:
            from notifications.application.services.notification_dispatcher import (
                NotificationDispatcher,
            )

            NotificationDispatcher().notify_admins(
                title="شکست بکاپ روزانه",
                message=(
                    "بکاپ زمان‌بندی‌شده سامانه ناموفق بود. "
                    f"جزئیات: {run.error_message[:400] or 'بدون پیام'}"
                ),
                resource_type="backup_run",
                resource_id=str(run.pk),
            )
        except Exception:
            logger.exception("Failed to notify admins about backup failure.")

    @staticmethod
    def read_latest_file_status() -> dict | None:
        root = Path(getattr(settings, "BACKUP_ROOT", "/backups"))
        path = root / LATEST_STATUS_FILENAME
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
