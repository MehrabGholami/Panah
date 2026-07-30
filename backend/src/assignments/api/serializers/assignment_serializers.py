from django.core.cache import cache
from rest_framework import serializers

from assignments.models import Assignment, AssignmentTask


class AssignmentSerializer(serializers.ModelSerializer):
    mission_title = serializers.CharField(source="mission.title", read_only=True)
    volunteer_email = serializers.EmailField(source="volunteer.user.email", read_only=True)
    volunteer_name = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            "id",
            "mission",
            "mission_title",
            "volunteer",
            "volunteer_email",
            "volunteer_name",
            "status",
            "tasks_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_volunteer_name(self, obj):
        user = obj.volunteer.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email

    def get_tasks_count(self, obj):
        count = getattr(obj, "tasks_count", None)
        if count is not None:
            return count
        return obj.tasks.count()


class AssignmentCreateSerializer(serializers.Serializer):
    mission_id = serializers.UUIDField()
    volunteer_id = serializers.UUIDField()


class AssignmentTaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentTask
        fields = (
            "id",
            "assignment",
            "title",
            "description",
            "status",
            "created_by",
            "created_by_name",
            "status_updated_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "assignment",
            "status",
            "created_by",
            "created_by_name",
            "status_updated_at",
            "created_at",
            "updated_at",
        )

    def get_created_by_name(self, obj):
        user = obj.created_by
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email


class AssignmentTaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")


class AssignmentTaskUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)


class AssignmentTaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["not_done", "in_progress", "done"],
    )


IDEMPOTENCY_HEADER = "HTTP_IDEMPOTENCY_KEY"  # Idempotency-Key request header
IDEMPOTENCY_CACHE_TTL = 86400


def get_idempotent_response(request, cache_prefix: str):
    key = request.META.get(IDEMPOTENCY_HEADER)
    if not key:
        return None, None
    cache_key = f"idempotency:{cache_prefix}:{key}"
    cached = cache.get(cache_key)
    return key, cached


def store_idempotent_response(request, cache_prefix: str, response_data, status_code: int):
    key = request.META.get(IDEMPOTENCY_HEADER)
    if not key:
        return
    cache_key = f"idempotency:{cache_prefix}:{key}"
    cache.set(cache_key, {"data": response_data, "status": status_code}, timeout=IDEMPOTENCY_CACHE_TTL)
