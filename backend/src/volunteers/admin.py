from django.contrib import admin

from volunteers.models import VolunteerProfile


@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "national_id", "city", "status", "created_at")
    list_filter = ("status", "city")
    search_fields = ("national_id", "user__email", "city")
    readonly_fields = ("created_at", "updated_at")
