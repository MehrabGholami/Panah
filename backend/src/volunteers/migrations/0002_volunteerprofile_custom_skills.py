from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("volunteers", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="volunteerprofile",
            name="custom_skills",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
