from django.contrib import admin

from missions.models import (
    Mission,
    MissionApplication,
    MissionCoordinatorRequest,
    MissionRequiredSkill,
)


class MissionRequiredSkillInline(admin.TabularInline):
    model = MissionRequiredSkill
    extra = 0


class MissionApplicationInline(admin.TabularInline):
    model = MissionApplication
    extra = 0
    fields = ("volunteer", "status", "reviewed_by", "reviewed_at", "review_note")
    readonly_fields = ("reviewed_at",)
    show_change_link = True


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "disaster",
        "coordinator",
        "status",
        "priority",
        "start_time",
        "is_visible_to_volunteers",
        "created_at",
    )
    list_filter = ("status", "priority", "is_visible_to_volunteers")
    search_fields = ("title", "coordinator__email", "disaster__title")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("disaster", "coordinator")
    inlines = [MissionRequiredSkillInline, MissionApplicationInline]


@admin.register(MissionApplication)
class MissionApplicationAdmin(admin.ModelAdmin):
    list_display = ("mission", "volunteer", "status", "reviewed_by", "reviewed_at", "created_at")
    list_filter = ("status",)
    search_fields = ("mission__title", "volunteer__user__email", "volunteer__national_id")
    readonly_fields = ("created_at", "updated_at", "reviewed_at")
    raw_id_fields = ("mission", "volunteer", "reviewed_by")


@admin.register(MissionCoordinatorRequest)
class MissionCoordinatorRequestAdmin(admin.ModelAdmin):
    list_display = ("mission", "requester", "status", "reviewed_by", "created_at")
    list_filter = ("status",)
    search_fields = ("mission__title", "requester__email", "message")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("mission", "requester", "reviewed_by")
