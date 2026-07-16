from __future__ import annotations

from django.utils import timezone

from notifications.models import Notification
from common.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    def list_for_user(self, user_id):
        return self.model.objects.filter(user_id=user_id).order_by("-created_at")

    def unread_count_for_user(self, user_id) -> int:
        return self.model.objects.filter(user_id=user_id, read_at__isnull=True).count()

    def mark_read_for_user(self, notification_id, user_id):
        notification = self.model.objects.filter(pk=notification_id, user_id=user_id).first()
        if notification and notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at", "updated_at"])
        return notification

    def mark_all_read_for_user(self, user_id) -> int:
        return self.model.objects.filter(user_id=user_id, read_at__isnull=True).update(
            read_at=timezone.now()
        )
