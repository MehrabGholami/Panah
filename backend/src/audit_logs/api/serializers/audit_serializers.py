from rest_framework import serializers

from audit_logs.application.services.audit_summary import build_audit_change_summary
from audit_logs.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_roles = serializers.SerializerMethodField()
    change_summary = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "user_id",
            "user_name",
            "user_roles",
            "action",
            "resource_type",
            "resource_id",
            "change_summary",
            "ip_address",
            "user_agent",
            "correlation_id",
            "metadata",
            "created_at",
        )
        read_only_fields = fields

    def _get_user(self, obj):
        user_map = self.context.get("user_map", {})
        if not obj.user_id:
            return None
        return user_map.get(obj.user_id)

    def get_user_name(self, obj):
        user = self._get_user(obj)
        if not user:
            return None
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email

    def get_user_roles(self, obj):
        user = self._get_user(obj)
        if not user:
            return []
        return [user_role.role.slug for user_role in user.user_roles.all()]

    def get_change_summary(self, obj):
        return build_audit_change_summary(obj)
