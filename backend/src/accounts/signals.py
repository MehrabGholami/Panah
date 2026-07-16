from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from accounts.application.services.permission_service import PermissionService
from accounts.models import RolePermission, UserRole


def _invalidate_for_role(role_id):
    user_ids = UserRole.objects.filter(role_id=role_id).values_list("user_id", flat=True)
    service = PermissionService()
    for user_id in user_ids:
        service.invalidate_user_cache(user_id)


@receiver(post_save, sender=UserRole)
@receiver(post_delete, sender=UserRole)
def invalidate_user_role_cache(sender, instance, **kwargs):
    PermissionService().invalidate_user_cache(instance.user_id)


@receiver(post_save, sender=RolePermission)
@receiver(post_delete, sender=RolePermission)
def invalidate_role_permission_cache(sender, instance, **kwargs):
    _invalidate_for_role(instance.role_id)
