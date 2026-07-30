import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import assignments.domain.enums


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AssignmentTask",
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
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("not_done", "Not Done"),
                            ("in_progress", "In Progress"),
                            ("done", "Done"),
                        ],
                        db_index=True,
                        default=assignments.domain.enums.AssignmentTaskStatus["NOT_DONE"],
                        max_length=20,
                    ),
                ),
                ("status_updated_at", models.DateTimeField(blank=True, null=True)),
                (
                    "assignment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tasks",
                        to="assignments.assignment",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="created_assignment_tasks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "assignments_assignmenttask",
                "ordering": ["created_at"],
            },
        ),
    ]
