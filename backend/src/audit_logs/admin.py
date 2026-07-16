from django.contrib import admin

from audit_logs.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "resource_type", "resource_id", "user_id", "created_at")
    list_filter = ("action", "resource_type")
    search_fields = ("resource_id", "correlation_id", "user_id")
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
