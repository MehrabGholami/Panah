from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from notifications.domain.enums import NotificationChannel


class Notification(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    channel = models.CharField(
        max_length=20,
        choices=NotificationChannel.choices(),
        default=NotificationChannel.IN_APP,
        db_index=True,
    )
    resource_type = models.CharField(max_length=100, blank=True, db_index=True)
    resource_id = models.CharField(max_length=100, blank=True, db_index=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} -> {self.user.email}"

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
