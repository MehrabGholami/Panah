from __future__ import annotations

from accounts.domain.exceptions import DuplicateRoleError, RoleNotFoundError
from accounts.infrastructure.repositories.user_repository import RoleRepository
from accounts.models import Role, RolePermission
from common.services.base_service import BaseService


class RoleService(BaseService):
    def __init__(self, repository: RoleRepository | None = None):
        super().__init__(repository or RoleRepository())

    def list_roles(self):
        return self.repository.list_with_permissions()

    def get_role(self, role_id):
        role = self.repository.get_by_id(role_id)
        if not role:
            raise RoleNotFoundError()
        return role

    def create_role(self, name: str, slug: str, description: str = "", permission_ids=None):
        if self.repository.get_by_slug(slug):
            raise DuplicateRoleError()
        role = self.repository.create(name=name, slug=slug, description=description)
        if permission_ids:
            self._sync_permissions(role, permission_ids)
        return role

    def update_role(self, role_id, **data):
        role = self.get_role(role_id)
        permission_ids = data.pop("permission_ids", None)
        role = self.repository.update(role, **data)
        if permission_ids is not None:
            self._sync_permissions(role, permission_ids)
        return role

    def delete_role(self, role_id):
        role = self.get_role(role_id)
        if role.is_system:
            from common.exceptions.api_exceptions import PermissionDeniedError

            raise PermissionDeniedError("System roles cannot be deleted.")
        self.repository.soft_delete(role)

    def _sync_permissions(self, role: Role, permission_ids: list):
        RolePermission.objects.filter(role=role).delete()
        for permission_id in permission_ids:
            RolePermission.objects.create(role=role, permission_id=permission_id)
