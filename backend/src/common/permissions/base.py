from rest_framework.permissions import BasePermission

from accounts.application.services.permission_service import PermissionService


class HasPermission(BasePermission):
    permission_codename: str = ""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        any_codenames = getattr(view, "required_any_permissions", None)
        if any_codenames:
            service = PermissionService()
            return any(
                service.user_has_permission(request.user, codename)
                for codename in any_codenames
            )

        codename = getattr(view, "required_permission", None) or self.permission_codename
        if not codename:
            return True
        return PermissionService().user_has_permission(request.user, codename)
