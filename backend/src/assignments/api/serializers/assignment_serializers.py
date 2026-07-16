from django.core.cache import cache
from rest_framework import serializers

from assignments.models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    mission_title = serializers.CharField(source="mission.title", read_only=True)
    volunteer_email = serializers.EmailField(source="volunteer.user.email", read_only=True)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "mission",
            "mission_title",
            "volunteer",
            "volunteer_email",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class AssignmentCreateSerializer(serializers.Serializer):
    mission_id = serializers.UUIDField()
    volunteer_id = serializers.UUIDField()


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
