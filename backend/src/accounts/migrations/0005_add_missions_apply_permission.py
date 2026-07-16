from django.db import migrations


def add_missions_apply_permission(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    Role = apps.get_model("accounts", "Role")
    RolePermission = apps.get_model("accounts", "RolePermission")

    permission, _ = Permission.objects.get_or_create(
        codename="missions.apply",
        defaults={
            "name": "Apply to missions",
            "app_label": "missions",
        },
    )

    for slug in ("admin", "volunteer"):
        role = Role.objects.filter(slug=slug).first()
        if role:
            RolePermission.objects.get_or_create(role=role, permission=permission)


def remove_missions_apply_permission(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")
    RolePermission = apps.get_model("accounts", "RolePermission")

    permission = Permission.objects.filter(codename="missions.apply").first()
    if not permission:
        return
    RolePermission.objects.filter(permission=permission).delete()
    permission.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_remove_viewer_role"),
        ("missions", "0002_mission_extended_fields"),
    ]

    operations = [
        migrations.RunPython(add_missions_apply_permission, remove_missions_apply_permission),
    ]
