from __future__ import annotations

from django.db import transaction

from accounts.application.services.permission_service import PermissionService
from accounts.application.services.role_service import RoleService
from accounts.infrastructure.repositories.user_repository import UserRepository
from accounts.models import UserRole
from accounts.models import User
from common.services.base_service import BaseService


class UserService(BaseService):
    def __init__(self, repository: UserRepository | None = None):
        super().__init__(repository or UserRepository())

    def list_users(self):
        return (
            self.repository.list()
            .select_related("volunteer_profile")
            .prefetch_related(
                "user_roles__role",
                "volunteer_profile__volunteer_skills__skill",
            )
        )

    def get_user(self, user_id) -> User:
        from accounts.domain.exceptions import UserNotFoundError

        user = self.repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return user

    def get_user_permissions(self, user: User) -> set[str]:
        return PermissionService().get_user_permissions(user)

    @transaction.atomic
    def assign_roles(self, user_id, role_slugs: list[str]) -> User:
        from common.exceptions.api_exceptions import ValidationError

        if len(role_slugs) > 1:
            raise ValidationError("Each user can only have one role.")

        user = self.get_user(user_id)
        roles = []
        role_service = RoleService()
        for slug in role_slugs:
            role = role_service.repository.get_by_slug(slug)
            if not role:
                from accounts.domain.exceptions import RoleNotFoundError

                raise RoleNotFoundError()
            roles.append(role)

        target_role_ids = {role.id for role in roles}

        UserRole.objects.filter(user=user).exclude(role_id__in=target_role_ids).delete()

        for role in roles:
            user_role = UserRole.all_objects.filter(user=user, role=role).first()
            if user_role:
                if user_role.deleted_at:
                    user_role.restore()
            else:
                UserRole.objects.create(user=user, role=role)

        PermissionService().invalidate_user_cache(user.id)

        return (
            self.repository.model.objects.filter(id=user.id)
            .select_related("volunteer_profile")
            .prefetch_related("user_roles__role")
            .first()
        )

    @transaction.atomic
    def set_access(self, user_id, *, is_active: bool, actor: User) -> User:
        from audit_logs.application.services.audit_service import AuditService
        from audit_logs.domain.enums import AuditAction
        from common.exceptions.api_exceptions import ValidationError

        user = self.get_user(user_id)
        if user.pk == actor.pk:
            raise ValidationError("You cannot change your own access status.")
        if user.is_superuser:
            raise ValidationError("Superuser access cannot be changed.")
        if user.user_roles.filter(role__slug="admin").exists():
            raise ValidationError("Admin users cannot be blocked.")

        user.is_active = is_active
        user.save(update_fields=["is_active", "updated_at"])

        full_name = f"{user.first_name} {user.last_name}".strip()
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="user",
            resource_id=user.pk,
            user_id=actor.pk,
            metadata={
                "access_change": "blocked" if not is_active else "unblocked",
                "target_email": user.email,
                "target_name": full_name or user.email,
            },
        )

        return (
            self.repository.model.objects.filter(id=user.id)
            .select_related("volunteer_profile")
            .prefetch_related("user_roles__role")
            .first()
        )
