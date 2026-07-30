from django.contrib import admin

from assignments.models import Assignment, AssignmentTask


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("mission", "volunteer", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("mission__title", "volunteer__user__email", "volunteer__national_id")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("mission", "volunteer")


@admin.register(AssignmentTask)
class AssignmentTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "assignment", "status", "created_by", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "assignment__mission__title", "assignment__volunteer__user__email")
    readonly_fields = ("created_at", "updated_at", "status_updated_at")
    raw_id_fields = ("assignment", "created_by")
