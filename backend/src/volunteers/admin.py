from django.contrib import admin

from volunteers.models import VolunteerProfile


@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "national_id", "city", "gender", "status", "created_at")
    list_filter = ("status", "gender", "city")
    search_fields = ("national_id", "user__email", "user__first_name", "user__last_name", "city")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("user",)
