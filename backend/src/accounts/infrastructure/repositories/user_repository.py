from __future__ import annotations

from accounts.models import Permission, Role, User
from common.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        normalized = User.objects.normalize_email(email.strip())
        return self.model.objects.filter(email__iexact=normalized).first()

    def list_approved(self):
        return self.model.objects.filter(is_approved=True, is_active=True)

    def assign_role(self, user: User, role: Role):
        from accounts.models import UserRole

        UserRole.objects.get_or_create(user=user, role=role)


class RoleRepository(BaseRepository[Role]):
    model = Role

    def get_by_slug(self, slug: str) -> Role | None:
        return self.model.objects.filter(slug=slug).first()

    def list_with_permissions(self):
        return self.model.objects.prefetch_related("role_permissions__permission")


class PermissionRepository(BaseRepository[Permission]):
    model = Permission

    def get_by_codename(self, codename: str) -> Permission | None:
        return self.model.objects.filter(codename=codename).first()

    def list_codenames_for_user(self, user: User) -> set[str]:
        if user.is_superuser:
            return set(self.model.objects.values_list("codename", flat=True))
        return set(
            Permission.objects.filter(
                role_permissions__role__user_roles__user=user,
                role_permissions__role__user_roles__deleted_at__isnull=True,
                role_permissions__deleted_at__isnull=True,
            )
            .distinct()
            .values_list("codename", flat=True)
        )
