from __future__ import annotations

from django.db import transaction

from accounts.domain.enums import SystemRole
from accounts.infrastructure.repositories.user_repository import UserRepository
from accounts.models import Permission, Role, RolePermission, User

DEFAULT_PERMISSIONS = [
    ("volunteers.view", "View volunteers", "volunteers"),
    ("volunteers.create", "Create volunteers", "volunteers"),
    ("volunteers.approve", "Approve volunteers", "volunteers"),
    ("volunteers.update", "Update volunteers", "volunteers"),
    ("skills.view", "View skills", "skills"),
    ("skills.manage", "Manage skills", "skills"),
    ("disasters.view", "View disasters", "disasters"),
    ("disasters.create", "Create disasters", "disasters"),
    ("disasters.update", "Update disasters", "disasters"),
    ("missions.view", "View missions", "missions"),
    ("missions.create", "Create missions", "missions"),
    ("missions.assign", "Assign missions", "missions"),
    ("missions.apply", "Apply to missions", "missions"),
    ("assignments.view", "View assignments", "assignments"),
    ("assignments.manage", "Manage assignments", "assignments"),
    ("assignments.accept", "Accept assignments", "assignments"),
    ("assignments.decline", "Decline assignments", "assignments"),
    ("reports.view", "View reports", "reports"),
    ("reports.submit", "Submit reports", "reports"),
    ("notifications.view", "View notifications", "notifications"),
    ("tickets.view", "View tickets", "tickets"),
    ("tickets.create", "Create tickets", "tickets"),
    ("tickets.reply", "Reply to tickets", "tickets"),
    ("dashboard.view", "View dashboard", "dashboard"),
    ("audit.view", "View audit logs", "audit_logs"),
    ("accounts.manage_users", "Manage users", "accounts"),
    ("accounts.view_users", "View users", "accounts"),
    ("accounts.manage_roles", "Manage roles", "accounts"),
]

ROLE_PERMISSIONS = {
    SystemRole.ADMIN: [p[0] for p in DEFAULT_PERMISSIONS],
    SystemRole.COORDINATOR: [
        "volunteers.view",
        "disasters.view",
        "disasters.create",
        "disasters.update",
        "missions.view",
        "missions.create",
        "missions.assign",
        "assignments.view",
        "assignments.manage",
        "reports.view",
        "reports.submit",
        "notifications.view",
        "tickets.view",
        "tickets.create",
        "tickets.reply",
        "dashboard.view",
        "accounts.view_users",
    ],
    SystemRole.VOLUNTEER: [
        "missions.view",
        "missions.apply",
        "assignments.view",
        "assignments.accept",
        "assignments.decline",
        "reports.submit",
        "notifications.view",
        "tickets.view",
        "tickets.create",
        "dashboard.view",
    ],
}


class SeedService:
    def seed_all(self, admin_email: str, admin_password: str) -> dict:
        with transaction.atomic():
            self._remove_viewer_role()
            permissions = self._seed_permissions()
            roles = self._seed_roles(permissions)
            admin = self._seed_admin(admin_email, admin_password, roles[SystemRole.ADMIN])
            skills_created = self._seed_skills()
        return {
            "permissions": len(permissions),
            "roles": len(roles),
            "admin_email": admin.email,
            "skills_created": skills_created,
        }

    def _remove_viewer_role(self) -> None:
        viewer_role = Role.objects.filter(slug="viewer").first()
        if not viewer_role:
            return
        from accounts.models import UserRole

        UserRole.objects.filter(role=viewer_role).delete()
        RolePermission.objects.filter(role=viewer_role).delete()
        viewer_role.delete()

    def _seed_permissions(self) -> dict[str, Permission]:
        result = {}
        for codename, name, app_label in DEFAULT_PERMISSIONS:
            permission, _ = Permission.objects.get_or_create(
                codename=codename,
                defaults={"name": name, "app_label": app_label},
            )
            result[codename] = permission
        return result

    def _seed_roles(self, permissions: dict[str, Permission]) -> dict[str, Role]:
        roles = {}
        for role_enum in SystemRole:
            role, _ = Role.objects.get_or_create(
                slug=role_enum.value,
                defaults={
                    "name": role_enum.value.replace("_", " ").title(),
                    "description": f"System role: {role_enum.value}",
                    "is_system": True,
                },
            )
            desired = set(ROLE_PERMISSIONS[role_enum])
            for codename in desired:
                RolePermission.objects.get_or_create(
                    role=role,
                    permission=permissions[codename],
                )
            # Keep system role permissions aligned with ROLE_PERMISSIONS.
            RolePermission.objects.filter(role=role).exclude(
                permission__codename__in=desired
            ).delete()
            roles[role_enum] = role
        return roles

    def _seed_skills(self) -> int:
        from skills.application.services.skill_seed_service import seed_default_skills

        return seed_default_skills()

    def _seed_admin(self, email: str, password: str, admin_role: Role) -> User:
        user_repo = UserRepository()
        normalized_email = User.objects.normalize_email(email.strip())
        user, _created = user_repo.get_or_create(
            email=normalized_email,
            defaults={
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "is_approved": True,
                "first_name": "Investica",
                "last_name": "Admin",
            },
        )
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.is_approved = True
        user.set_password(password)
        user.save(
            update_fields=[
                "is_staff",
                "is_superuser",
                "is_active",
                "is_approved",
                "password",
                "updated_at",
            ]
        )
        user_repo.assign_role(user, admin_role)
        return user
