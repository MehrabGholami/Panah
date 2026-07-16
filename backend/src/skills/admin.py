from django.contrib import admin

from skills.models import Skill, VolunteerSkill


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("name", "category")
    readonly_fields = ("created_at", "updated_at")


@admin.register(VolunteerSkill)
class VolunteerSkillAdmin(admin.ModelAdmin):
    list_display = ("volunteer", "skill", "proficiency", "created_at")
    list_filter = ("proficiency",)
    search_fields = ("volunteer__user__email", "skill__name")
    readonly_fields = ("created_at", "updated_at")
