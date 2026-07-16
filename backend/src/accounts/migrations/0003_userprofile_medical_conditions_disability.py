from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_user_avatar_userprofile"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="medical_conditions",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="disability",
            field=models.TextField(blank=True),
        ),
    ]
