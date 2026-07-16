import accounts.models.user
import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="avatar",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=accounts.models.user.user_avatar_path,
            ),
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("education", models.CharField(blank=True, max_length=255)),
                ("occupation", models.CharField(blank=True, max_length=150)),
                ("interests", models.TextField(blank=True)),
                ("address", models.TextField(blank=True)),
                ("blood_type", models.CharField(blank=True, max_length=10)),
                ("languages", models.CharField(blank=True, max_length=255)),
                ("years_of_experience", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("emergency_contact_name", models.CharField(blank=True, max_length=150)),
                ("emergency_contact_phone", models.CharField(blank=True, max_length=20)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "db_table": "accounts_user_profile",
            },
        ),
    ]
