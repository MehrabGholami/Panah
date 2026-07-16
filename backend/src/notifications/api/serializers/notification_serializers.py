from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "title",
            "message",
            "read_at",
            "is_read",
            "channel",
            "resource_type",
            "resource_id",
            "created_at",
        )
        read_only_fields = fields
