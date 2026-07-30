from django.contrib import admin

from audit_logs.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "resource_type", "resource_id", "user_id", "ip_address")
    list_filter = ("action", "resource_type", "created_at")
    search_fields = ("resource_id", "correlation_id", "user_id", "ip_address")
    date_hierarchy = "created_at"
    readonly_fields = (
        "user_id",
        "action",
        "resource_type",
        "resource_id",
        "ip_address",
        "user_agent",
        "correlation_id",
        "metadata",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
