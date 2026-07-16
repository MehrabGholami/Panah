from __future__ import annotations

from common.services.base_service import BaseService
from notifications.domain.enums import NotificationChannel
from notifications.domain.exceptions import NotificationNotFoundError
from notifications.infrastructure.repositories.notification_repository import NotificationRepository
from notifications.models import Notification
from notifications.tasks import send_email_notification


class NotificationService(BaseService):
    repository: NotificationRepository

    def __init__(self, repository: NotificationRepository | None = None):
        super().__init__(repository or NotificationRepository())

    def list_for_user(self, user_id):
        return self.repository.list_for_user(user_id)

    def get_for_user(self, notification_id, user_id) -> Notification:
        notification = self.repository.model.objects.filter(
            pk=notification_id, user_id=user_id
        ).first()
        if not notification:
            raise NotificationNotFoundError()
        return notification

    def create(
        self,
        user_id,
        title: str,
        message: str,
        channel: str = NotificationChannel.IN_APP,
        resource_type: str = "",
        resource_id: str = "",
    ) -> Notification:
        notification = self.repository.create(
            user_id=user_id,
            title=title,
            message=message,
            channel=channel,
            resource_type=resource_type,
            resource_id=resource_id,
        )
        if channel == NotificationChannel.EMAIL:
            send_email_notification.delay(str(notification.pk))
        return notification

    def mark_read(self, notification_id, user_id) -> Notification:
        notification = self.repository.mark_read_for_user(notification_id, user_id)
        if not notification:
            raise NotificationNotFoundError()
        return notification

    def mark_all_read(self, user_id) -> int:
        return self.repository.mark_all_read_for_user(user_id)

    def unread_count(self, user_id) -> int:
        return self.repository.unread_count_for_user(user_id)
