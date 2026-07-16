from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("disasters", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="disaster",
            name="affected_population",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="disaster",
            name="city",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="disaster",
            name="disaster_type",
            field=models.CharField(
                choices=[
                    ("earthquake", "Earthquake"),
                    ("flood", "Flood"),
                    ("fire", "Fire"),
                    ("storm", "Storm"),
                    ("landslide", "Landslide"),
                    ("epidemic", "Epidemic"),
                    ("drought", "Drought"),
                    ("industrial", "Industrial"),
                    ("other", "Other"),
                ],
                db_index=True,
                default="other",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="disaster",
            name="needs",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="disaster",
            name="occurred_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="disaster",
            name="province",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
