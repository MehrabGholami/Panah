from django.contrib import admin

from disasters.models import Disaster


@admin.register(Disaster)
class DisasterAdmin(admin.ModelAdmin):
    list_display = ("title", "severity", "status", "location", "created_at")
    list_filter = ("severity", "status")
    search_fields = ("title", "location")
    readonly_fields = ("created_at", "updated_at")
