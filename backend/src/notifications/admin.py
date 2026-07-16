from django.contrib import admin

from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "channel", "read_at", "created_at")
    list_filter = ("channel", "read_at")
    search_fields = ("title", "user__email", "message")
    readonly_fields = ("created_at", "updated_at")
