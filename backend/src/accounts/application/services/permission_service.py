from __future__ import annotations

from django.conf import settings
from django.core.cache import cache

from accounts.infrastructure.repositories.user_repository import PermissionRepository
from accounts.models import User
from common.services.base_service import BaseService


class PermissionService(BaseService):
    CACHE_PREFIX = "user_permissions"

    def __init__(self, repository: PermissionRepository | None = None):
        self.repository = repository or PermissionRepository()

    def _cache_key(self, user_id) -> str:
        return f"{self.CACHE_PREFIX}:{user_id}"

    def get_user_permissions(self, user: User) -> set[str]:
        if user.is_superuser:
            return self.repository.list_codenames_for_user(user)
        cache_key = self._cache_key(user.pk)
        cached = cache.get(cache_key)
        if cached is not None:
            return set(cached)
        permissions = self.repository.list_codenames_for_user(user)
        cache.set(cache_key, list(permissions), timeout=settings.PERMISSION_CACHE_TTL)
        return permissions

    def user_has_permission(self, user: User, codename: str) -> bool:
        if user.is_superuser:
            return True
        return codename in self.get_user_permissions(user)

    def invalidate_user_cache(self, user_id) -> None:
        cache.delete(self._cache_key(user_id))

    def invalidate_role_users_cache(self, role_id) -> None:
        from accounts.models import UserRole

        for user_id in UserRole.objects.filter(role_id=role_id).values_list("user_id", flat=True):
            self.invalidate_user_cache(user_id)
