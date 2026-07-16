from django.contrib import admin

from assignments.models import Assignment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("mission", "volunteer", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("mission__title", "volunteer__user__email")
    readonly_fields = ("created_at", "updated_at")
