from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("missions", "0002_mission_extended_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="mission",
            name="is_end_time_tba",
            field=models.BooleanField(default=False),
        ),
    ]
