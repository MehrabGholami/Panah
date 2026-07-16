from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("volunteers", "0002_volunteerprofile_custom_skills"),
    ]

    operations = [
        migrations.AlterField(
            model_name="volunteerprofile",
            name="status",
            field=models.CharField(
                choices=[
                    ("registered", "Registered"),
                    ("pending_approval", "Pending Approval"),
                    ("active", "Active"),
                    ("rejected", "Rejected"),
                ],
                db_index=True,
                default="active",
                max_length=30,
            ),
        ),
    ]
