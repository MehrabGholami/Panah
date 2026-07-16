from django.contrib import admin

from missions.models import Mission


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ("title", "disaster", "coordinator", "status", "start_time", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "coordinator__email")
    readonly_fields = ("created_at", "updated_at")
