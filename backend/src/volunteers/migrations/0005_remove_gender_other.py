from django.db import migrations, models


def migrate_other_to_unspecified(apps, schema_editor):
    VolunteerProfile = apps.get_model("volunteers", "VolunteerProfile")
    VolunteerProfile.objects.filter(gender="other").update(gender="unspecified")


class Migration(migrations.Migration):

    dependencies = [
        ("volunteers", "0004_volunteerprofile_gender"),
    ]

    operations = [
        migrations.RunPython(migrate_other_to_unspecified, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="volunteerprofile",
            name="gender",
            field=models.CharField(
                choices=[
                    ("female", "Female"),
                    ("male", "Male"),
                    ("unspecified", "Unspecified"),
                ],
                db_index=True,
                default="unspecified",
                max_length=20,
            ),
        ),
    ]
