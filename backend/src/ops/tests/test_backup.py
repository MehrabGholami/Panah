from datetime import timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Permission, Role, RolePermission, User, UserRole
from ops.application.services.backup_service import BackupService, RETENTION_DAYS
from ops.domain.enums import BackupStatus, BackupTriggeredBy, BackupType
from ops.models import BackupRun


@pytest.fixture
def backup_root(tmp_path, settings):
    root = tmp_path / "backups"
    root.mkdir()
    settings.BACKUP_ROOT = root
    settings.MEDIA_ROOT = tmp_path / "media"
    settings.MEDIA_ROOT.mkdir()
    (settings.MEDIA_ROOT / "sample.txt").write_text("media", encoding="utf-8")
    return root


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        email="admin@example.com",
        password="test-pass-123",
        is_staff=True,
        is_superuser=True,
        is_approved=True,
    )
    role = Role.objects.create(name="Admin", slug="admin", is_system=True)
    view_perm = Permission.objects.create(
        codename="ops.view_backups", name="View backups", app_label="ops"
    )
    run_perm = Permission.objects.create(
        codename="ops.run_backup", name="Run backup", app_label="ops"
    )
    RolePermission.objects.create(role=role, permission=view_perm)
    RolePermission.objects.create(role=role, permission=run_perm)
    UserRole.objects.create(user=user, role=role)
    return user


@pytest.fixture
def volunteer_user(db):
    return User.objects.create_user(
        email="volunteer@example.com",
        password="test-pass-123",
        is_approved=True,
    )


@pytest.mark.django_db
def test_prune_old_backups_removes_files_and_rows(backup_root):
    old_file = backup_root / "volunteer_management_old.sql.gz"
    old_file.write_bytes(b"old")
    old_mtime = (timezone.now() - timedelta(days=RETENTION_DAYS + 2)).timestamp()
    import os

    os.utime(old_file, (old_mtime, old_mtime))

    fresh_file = backup_root / "volunteer_management_new.sql.gz"
    fresh_file.write_bytes(b"new")

    old_run = BackupRun.objects.create(
        status=BackupStatus.SUCCESS,
        backup_type=BackupType.FULL,
        triggered_by=BackupTriggeredBy.SCHEDULE,
        size_bytes=1,
    )
    BackupRun.objects.filter(pk=old_run.pk).update(
        started_at=timezone.now() - timedelta(days=RETENTION_DAYS + 5)
    )
    fresh_run = BackupRun.objects.create(
        status=BackupStatus.SUCCESS,
        backup_type=BackupType.FULL,
        triggered_by=BackupTriggeredBy.MANUAL,
        size_bytes=2,
    )

    result = BackupService().prune_old_backups()

    assert result["removed_files"] >= 1
    assert not old_file.exists()
    assert fresh_file.exists()
    assert not BackupRun.all_objects.filter(pk=old_run.pk).exists()
    assert BackupRun.objects.filter(pk=fresh_run.pk).exists()


@pytest.mark.django_db
def test_run_full_backup_success_mocked_pg_dump(backup_root):
    fake_dump = MagicMock()
    fake_dump.stdout = b"SQL DUMP"
    fake_dump.returncode = 0

    with patch("ops.application.services.backup_service.subprocess.run", return_value=fake_dump):
        with patch("ops.application.services.backup_service.AuditService") as audit_cls:
            audit_cls.return_value.log = MagicMock()
            run = BackupService().run_full_backup(triggered_by=BackupTriggeredBy.CLI)

    assert run.status == BackupStatus.SUCCESS
    assert run.size_bytes > 0
    assert Path(run.db_path).exists()
    assert Path(run.media_path).exists()
    assert (backup_root / "latest.json").exists()


@pytest.mark.django_db
def test_backup_api_requires_permission(volunteer_user, backup_root):
    client = APIClient()
    client.force_authenticate(user=volunteer_user)
    response = client.get("/api/v1/ops/backups/")
    assert response.status_code == 403


@pytest.mark.django_db
def test_backup_api_admin_can_list_and_status(admin_user, backup_root):
    BackupRun.objects.create(
        status=BackupStatus.SUCCESS,
        backup_type=BackupType.FULL,
        triggered_by=BackupTriggeredBy.SCHEDULE,
        size_bytes=100,
        finished_at=timezone.now(),
    )
    client = APIClient()
    client.force_authenticate(user=admin_user)

    list_resp = client.get("/api/v1/ops/backups/")
    assert list_resp.status_code == 200
    assert list_resp.json()["count"] >= 1

    status_resp = client.get("/api/v1/ops/backups/status/")
    assert status_resp.status_code == 200
    body = status_resp.json()
    assert body["last_backup_status"] == BackupStatus.SUCCESS
    assert body["retention_days"] == RETENTION_DAYS
    assert "database_name" in body
    assert body["database_name"]


@pytest.mark.django_db
def test_restore_api_requires_superuser(db, backup_root):
    staff = User.objects.create_user(
        email="staff@example.com",
        password="test-pass-123",
        is_staff=True,
        is_superuser=False,
        is_approved=True,
    )
    role = Role.objects.create(name="Ops Staff", slug="ops-staff", is_system=False)
    view_perm = Permission.objects.create(
        codename="ops.view_backups", name="View backups", app_label="ops"
    )
    run_perm = Permission.objects.create(
        codename="ops.run_backup", name="Run backup", app_label="ops"
    )
    RolePermission.objects.create(role=role, permission=view_perm)
    RolePermission.objects.create(role=role, permission=run_perm)
    UserRole.objects.create(user=staff, role=role)

    run = BackupRun.objects.create(
        status=BackupStatus.SUCCESS,
        backup_type=BackupType.DB,
        triggered_by=BackupTriggeredBy.MANUAL,
        db_path=str(backup_root / "demo.sql.gz"),
        size_bytes=10,
        finished_at=timezone.now(),
    )
    (backup_root / "demo.sql.gz").write_bytes(b"x")

    client = APIClient()
    client.force_authenticate(user=staff)
    resp = client.post(
        f"/api/v1/ops/backups/{run.pk}/restore/",
        {"confirm_db_name": "volunteer_management", "restore_media": False},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_restore_api_rejects_failed_backup(admin_user, backup_root):
    run = BackupRun.objects.create(
        status=BackupStatus.FAILED,
        backup_type=BackupType.FULL,
        triggered_by=BackupTriggeredBy.MANUAL,
        db_path="",
        size_bytes=0,
        finished_at=timezone.now(),
    )
    client = APIClient()
    client.force_authenticate(user=admin_user)
    resp = client.post(
        f"/api/v1/ops/backups/{run.pk}/restore/",
        {"confirm_db_name": "volunteer_management"},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_restore_api_rejects_wrong_confirm(admin_user, backup_root, settings):
    db_file = backup_root / "ok.sql.gz"
    db_file.write_bytes(b"SQL")
    run = BackupRun.objects.create(
        status=BackupStatus.SUCCESS,
        backup_type=BackupType.DB,
        triggered_by=BackupTriggeredBy.MANUAL,
        db_path=str(db_file),
        size_bytes=3,
        finished_at=timezone.now(),
    )
    client = APIClient()
    client.force_authenticate(user=admin_user)
    resp = client.post(
        f"/api/v1/ops/backups/{run.pk}/restore/",
        {"confirm_db_name": "wrong-name"},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_restore_api_success_mocked(admin_user, backup_root, settings):
    db_file = backup_root / "ok.sql.gz"
    db_file.write_bytes(b"SQL")
    run = BackupRun.objects.create(
        status=BackupStatus.SUCCESS,
        backup_type=BackupType.FULL,
        triggered_by=BackupTriggeredBy.MANUAL,
        db_path=str(db_file),
        media_path=str(backup_root / "media_ok.tar.gz"),
        size_bytes=10,
        finished_at=timezone.now(),
    )
    client = APIClient()
    client.force_authenticate(user=admin_user)

    mocked = {
        "database": settings.DATABASES["default"]["NAME"],
        "db_file": str(db_file),
        "media_file": "",
        "message": "ری‌استور انجام شد.",
    }
    with patch(
        "ops.api.views.backup_views.BackupService.restore_database",
        return_value=mocked,
    ) as restore_mock:
        resp = client.post(
            f"/api/v1/ops/backups/{run.pk}/restore/",
            {
                "confirm_db_name": settings.DATABASES["default"]["NAME"],
                "restore_media": False,
            },
            format="json",
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["message"]
    assert body["post_steps"]
    restore_mock.assert_called_once()


@pytest.mark.django_db
def test_health_includes_backup_fields(api_client, backup_root):
    response = api_client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert "last_backup_status" in data
    assert "last_backup_at" in data
    assert "last_backup_age_hours" in data


@pytest.mark.django_db
def test_seed_includes_ops_permissions(db):
    from django.core.management import call_command

    call_command("seed_data", admin_email="ops-admin@example.com", admin_password="testpass123!")
    assert Permission.objects.filter(codename="ops.view_backups").exists()
    assert Permission.objects.filter(codename="ops.run_backup").exists()
