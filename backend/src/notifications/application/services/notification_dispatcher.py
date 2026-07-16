from __future__ import annotations

from accounts.domain.enums import SystemRole
from accounts.models import User
from notifications.application.services.notification_service import NotificationService
from notifications.domain.enums import NotificationChannel


class NotificationDispatcher:
    """Role-aware helpers for creating in-app notifications."""

    def __init__(self, service: NotificationService | None = None):
        self.service = service or NotificationService()

    def notify_user(
        self,
        user_id,
        *,
        title: str,
        message: str,
        resource_type: str = "",
        resource_id: str = "",
        channel: str = NotificationChannel.IN_APP,
    ) -> None:
        if not user_id:
            return
        self.service.create(
            user_id=user_id,
            title=title,
            message=message,
            channel=channel,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else "",
        )

    def notify_roles(
        self,
        role_slugs: list[str],
        *,
        title: str,
        message: str,
        resource_type: str = "",
        resource_id: str = "",
        exclude_user_ids: set | None = None,
    ) -> int:
        exclude = {str(uid) for uid in (exclude_user_ids or set()) if uid}
        user_ids = list(
            User.objects.filter(
                is_active=True,
                user_roles__role__slug__in=role_slugs,
            )
            .distinct()
            .values_list("pk", flat=True)
        )
        created = 0
        for user_id in user_ids:
            if str(user_id) in exclude:
                continue
            self.notify_user(
                user_id,
                title=title,
                message=message,
                resource_type=resource_type,
                resource_id=resource_id,
            )
            created += 1
        return created

    def notify_admins(
        self,
        *,
        title: str,
        message: str,
        resource_type: str = "",
        resource_id: str = "",
        exclude_user_ids: set | None = None,
    ) -> int:
        return self.notify_roles(
            [SystemRole.ADMIN.value],
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
            exclude_user_ids=exclude_user_ids,
        )

    def notify_mission_staff(
        self,
        mission,
        *,
        title: str,
        message: str,
        resource_type: str = "",
        resource_id: str = "",
    ) -> int:
        """Notify mission coordinator and all admins (deduplicated)."""
        exclude: set = set()
        created = 0
        if getattr(mission, "coordinator_id", None):
            self.notify_user(
                mission.coordinator_id,
                title=title,
                message=message,
                resource_type=resource_type,
                resource_id=resource_id,
            )
            exclude.add(str(mission.coordinator_id))
            created += 1
        created += self.notify_admins(
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
            exclude_user_ids=exclude,
        )
        return created
