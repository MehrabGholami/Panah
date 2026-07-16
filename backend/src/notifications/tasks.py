from __future__ import annotations

import logging

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(name="notifications.send_email_notification")
def send_email_notification(notification_id: str) -> bool:
    from notifications.models import Notification

    try:
        notification = Notification.objects.select_related("user").get(pk=notification_id)
    except Notification.DoesNotExist:
        logger.warning("Notification %s not found for email delivery.", notification_id)
        return False

    if not notification.user.email:
        logger.warning("User %s has no email for notification %s.", notification.user_id, notification_id)
        return False

    send_mail(
        subject=notification.title,
        message=notification.message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[notification.user.email],
        fail_silently=False,
    )
    return True
