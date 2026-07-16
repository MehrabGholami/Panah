from django.db import migrations


def rename_general_category(apps, schema_editor):
    Skill = apps.get_model("skills", "Skill")
    Skill.objects.filter(category="general").update(category="عمومی")


def revert_general_category(apps, schema_editor):
    Skill = apps.get_model("skills", "Skill")
    Skill.objects.filter(category="عمومی").update(category="general")


class Migration(migrations.Migration):
    dependencies = [
        ("skills", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(rename_general_category, revert_general_category),
    ]
