import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ops", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="BackupSettings",
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
                ("enabled", models.BooleanField(default=True)),
                (
                    "frequency",
                    models.CharField(
                        choices=[
                            ("daily", "Daily"),
                            ("weekly", "Weekly"),
                            ("monthly", "Monthly"),
                        ],
                        default="daily",
                        max_length=20,
                    ),
                ),
                ("hour", models.PositiveSmallIntegerField(default=2)),
                ("minute", models.PositiveSmallIntegerField(default=0)),
                (
                    "weekday",
                    models.PositiveSmallIntegerField(
                        default=0,
                        help_text="0=Monday … 6=Sunday (used when frequency=weekly)",
                    ),
                ),
                (
                    "day_of_month",
                    models.PositiveSmallIntegerField(
                        default=1,
                        help_text="1–28 (used when frequency=monthly)",
                    ),
                ),
                ("retention_days", models.PositiveIntegerField(default=30)),
            ],
            options={
                "verbose_name_plural": "backup settings",
                "db_table": "ops_backup_settings",
            },
        ),
    ]
