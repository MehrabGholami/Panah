from django.contrib import admin

from disasters.models import Disaster


@admin.register(Disaster)
class DisasterAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "disaster_type",
        "severity",
        "status",
        "province",
        "city",
        "occurred_at",
        "created_at",
    )
    list_filter = ("disaster_type", "severity", "status")
    search_fields = ("title", "location", "description", "province", "city")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
