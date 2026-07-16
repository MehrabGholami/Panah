from django.contrib import admin

from reports.models import MissionReport, ReportAttachment


class ReportAttachmentInline(admin.TabularInline):
    model = ReportAttachment
    extra = 0


@admin.register(MissionReport)
class MissionReportAdmin(admin.ModelAdmin):
    list_display = ("mission", "author", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("mission__title", "author__email")
    readonly_fields = ("created_at", "updated_at")
    inlines = [ReportAttachmentInline]


@admin.register(ReportAttachment)
class ReportAttachmentAdmin(admin.ModelAdmin):
    list_display = ("report", "file", "created_at")
    readonly_fields = ("created_at", "updated_at")
