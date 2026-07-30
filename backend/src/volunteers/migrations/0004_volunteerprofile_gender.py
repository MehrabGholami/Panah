import volunteers.domain.enums
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("volunteers", "0003_alter_volunteerprofile_status_default"),
    ]

    operations = [
        migrations.AddField(
            model_name="volunteerprofile",
            name="gender",
            field=models.CharField(
                choices=[
                    ("female", "Female"),
                    ("male", "Male"),
                    ("other", "Other"),
                    ("unspecified", "Unspecified"),
                ],
                db_index=True,
                default=volunteers.domain.enums.VolunteerGender["UNSPECIFIED"],
                max_length=20,
            ),
        ),
    ]
