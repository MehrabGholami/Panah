from rest_framework import serializers

from tickets.models import Ticket, TicketReply


class TicketReplySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketReply
        fields = (
            "id",
            "ticket",
            "author",
            "author_name",
            "body",
            "is_staff_reply",
            "created_at",
        )
        read_only_fields = (
            "id",
            "ticket",
            "author",
            "author_name",
            "is_staff_reply",
            "created_at",
        )

    def get_author_name(self, obj) -> str:
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.email


class TicketSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    opened_by_name = serializers.SerializerMethodField()
    is_staff_message = serializers.SerializerMethodField()
    replies = TicketReplySerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            "id",
            "title",
            "description",
            "status",
            "author",
            "author_name",
            "opened_by",
            "opened_by_name",
            "is_staff_message",
            "replies",
            "reply_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "author",
            "author_name",
            "opened_by",
            "opened_by_name",
            "is_staff_message",
            "status",
            "replies",
            "reply_count",
            "created_at",
            "updated_at",
        )

    def get_author_name(self, obj) -> str:
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.email

    def get_opened_by_name(self, obj) -> str | None:
        if not obj.opened_by_id:
            return None
        return (
            f"{obj.opened_by.first_name} {obj.opened_by.last_name}".strip()
            or obj.opened_by.email
        )

    def get_is_staff_message(self, obj) -> bool:
        return bool(obj.opened_by_id)

    def get_reply_count(self, obj) -> int:
        return obj.replies.count()


class TicketCreateSerializer(serializers.ModelSerializer):
    recipient_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Ticket
        fields = ("title", "description", "recipient_id")


class TicketReplyCreateSerializer(serializers.Serializer):
    body = serializers.CharField(min_length=1, max_length=5000)


class TicketStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["open", "in_progress", "answered", "closed"],
    )
