from common.exceptions.api_exceptions import NotFoundError


class NotificationNotFoundError(NotFoundError):
    default_detail = "Notification not found."
    default_code = "notification_not_found"
