from django.db import migrations


def remove_viewer_role(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    UserRole = apps.get_model("accounts", "UserRole")
    RolePermission = apps.get_model("accounts", "RolePermission")

    viewer_role = Role.objects.filter(slug="viewer").first()
    if not viewer_role:
        return

    UserRole.objects.filter(role=viewer_role).delete()
    RolePermission.objects.filter(role=viewer_role).delete()
    viewer_role.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_userprofile_medical_conditions_disability"),
    ]

    operations = [
        migrations.RunPython(remove_viewer_role, migrations.RunPython.noop),
    ]
