import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BackupRun",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("started_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("running", "Running"),
                            ("success", "Success"),
                            ("failed", "Failed"),
                        ],
                        db_index=True,
                        default="running",
                        max_length=20,
                    ),
                ),
                (
                    "backup_type",
                    models.CharField(
                        choices=[
                            ("full", "Full"),
                            ("db", "Db"),
                            ("media", "Media"),
                        ],
                        default="full",
                        max_length=20,
                    ),
                ),
                ("db_path", models.CharField(blank=True, max_length=500)),
                ("media_path", models.CharField(blank=True, max_length=500)),
                ("size_bytes", models.BigIntegerField(default=0)),
                ("error_message", models.TextField(blank=True)),
                (
                    "triggered_by",
                    models.CharField(
                        choices=[
                            ("schedule", "Schedule"),
                            ("manual", "Manual"),
                            ("cli", "Cli"),
                        ],
                        default="manual",
                        max_length=20,
                    ),
                ),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="backup_runs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "ops_backup_run",
                "ordering": ["-started_at"],
            },
        ),
    ]
