from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import path, reverse
from django.utils.html import format_html

from ops.application.services.backup_service import BackupService
from ops.application.services.backup_settings_service import BackupSettingsService
from ops.domain.enums import BackupStatus
from ops.models import BackupRun, BackupSettings
from ops.tasks import run_manual_backup


def _format_bytes(size: int) -> str:
    size = int(size or 0)
    if size < 1024:
        return f"{size} B"
    kb = size / 1024
    if kb < 1024:
        return f"{kb:.1f} KB"
    mb = kb / 1024
    if mb < 1024:
        return f"{mb:.1f} MB"
    return f"{mb / 1024:.2f} GB"


STATUS_LABELS = {
    BackupStatus.SUCCESS: "Success",
    BackupStatus.FAILED: "Failed",
    BackupStatus.RUNNING: "Running",
}


@admin.register(BackupSettings)
class BackupSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "enabled",
        "frequency",
        "hour",
        "minute",
        "weekday",
        "day_of_month",
        "retention_days",
        "updated_at",
    )
    fields = (
        "enabled",
        "frequency",
        "hour",
        "minute",
        "weekday",
        "day_of_month",
        "retention_days",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at")

    def has_add_permission(self, request):
        if BackupSettings.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        # Singleton UX: jump straight to the only settings row when present.
        obj = BackupSettings.objects.order_by("pk").first()
        if obj and request.method == "GET" and not request.GET:
            return HttpResponseRedirect(
                reverse("admin:ops_backupsettings_change", args=[obj.pk])
            )
        return super().changelist_view(request, extra_context=extra_context)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        BackupSettingsService().sync_celery_schedule(obj)
        messages.info(request, "Celery Beat schedule synchronized.")


@admin.register(BackupRun)
class BackupRunAdmin(admin.ModelAdmin):
    change_list_template = "admin/ops/backuprun/change_list.html"
    list_display = (
        "started_at",
        "finished_at",
        "status",
        "backup_type",
        "triggered_by",
        "size_mb",
        "actor",
        "restore_link",
    )
    list_filter = ("status", "backup_type", "triggered_by", "started_at")
    search_fields = ("db_path", "media_path", "error_message", "actor__email")
    readonly_fields = (
        "started_at",
        "finished_at",
        "status",
        "backup_type",
        "db_path",
        "media_path",
        "size_bytes",
        "error_message",
        "triggered_by",
        "actor",
        "created_at",
        "updated_at",
        "restore_link",
    )
    ordering = ("-started_at",)
    actions = ("action_run_backup_now",)

    @admin.display(description="Size (MB)")
    def size_mb(self, obj):
        return round((obj.size_bytes or 0) / (1024 * 1024), 2)

    @admin.display(description="Restore")
    def restore_link(self, obj):
        if obj.status != BackupStatus.SUCCESS or not obj.db_path:
            return "—"
        url = reverse("admin:ops_backuprun_restore", args=[obj.pk])
        return format_html(
            '<a class="btn btn-sm btn-danger" href="{}" title="Safe restore">'
            '<i class="fas fa-undo"></i> Restore</a>',
            url,
        )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.user.is_staff

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    @admin.action(description="Run full backup now")
    def action_run_backup_now(self, request, queryset):
        if not request.user.is_superuser:
            self.message_user(request, "Only superusers can run backups.", messages.ERROR)
            return
        async_result = run_manual_backup.delay(str(request.user.pk))
        self.message_user(
            request,
            f"Backup queued (task_id={async_result.id}).",
            messages.SUCCESS,
        )

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<uuid:pk>/restore/",
                self.admin_site.admin_view(self.restore_view),
                name="ops_backuprun_restore",
            ),
            path(
                "run-now/",
                self.admin_site.admin_view(self.run_now_view),
                name="ops_backuprun_run_now",
            ),
        ]
        return custom + urls

    def _backup_summary(self):
        BackupSettingsService().get_or_create()
        last = BackupRun.objects.order_by("-started_at").first()
        last_success = (
            BackupRun.objects.filter(status=BackupStatus.SUCCESS)
            .order_by("-started_at")
            .first()
        )
        settings_row = BackupSettings.objects.order_by("pk").first()
        last_status = last.status if last else None
        return {
            "last_status": last_status,
            "last_status_label": STATUS_LABELS.get(last_status, last_status or "—"),
            "last_success_at": last_success.started_at if last_success else None,
            "last_size_label": _format_bytes(
                (last_success or last).size_bytes if (last_success or last) else 0
            ),
            "retention_days": getattr(settings_row, "retention_days", 30) or 30,
            "last_error": (last.error_message if last and last.status == BackupStatus.FAILED else ""),
        }

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["run_backup_url"] = reverse("admin:ops_backuprun_run_now")
        extra_context["backup_summary"] = self._backup_summary()
        settings_obj = BackupSettings.objects.order_by("pk").first()
        if settings_obj:
            extra_context["settings_url"] = reverse(
                "admin:ops_backupsettings_change", args=[settings_obj.pk]
            )
        else:
            extra_context["settings_url"] = reverse("admin:ops_backupsettings_changelist")
        return super().changelist_view(request, extra_context=extra_context)

    def run_now_view(self, request):
        if not request.user.is_superuser:
            messages.error(request, "Only superusers can run backups.")
            return HttpResponseRedirect(reverse("admin:ops_backuprun_changelist"))
        async_result = run_manual_backup.delay(str(request.user.pk))
        messages.success(request, f"Backup queued (task_id={async_result.id}).")
        return HttpResponseRedirect(reverse("admin:ops_backuprun_changelist"))

    def restore_view(self, request, pk):
        run = get_object_or_404(BackupRun, pk=pk)
        if not request.user.is_superuser:
            messages.error(request, "Only superusers can restore.")
            return HttpResponseRedirect(reverse("admin:ops_backuprun_changelist"))

        if run.status != BackupStatus.SUCCESS or not run.db_path:
            messages.error(request, "This backup cannot be restored.")
            return HttpResponseRedirect(reverse("admin:ops_backuprun_changelist"))

        from django.conf import settings as dj_settings

        db_name = dj_settings.DATABASES["default"]["NAME"]
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "run": run,
            "db_name": db_name,
            "size_label": _format_bytes(run.size_bytes),
            "title": "Confirm database restore",
            "has_media": bool(run.media_path),
        }

        if request.method == "POST":
            confirm = (request.POST.get("confirm_db_name") or "").strip()
            restore_media = request.POST.get("restore_media") == "on"
            try:
                result = BackupService().restore_database(
                    run.db_path,
                    confirm_db_name=confirm,
                    actor=request.user,
                    restore_media=restore_media,
                    media_file=run.media_path or None,
                )
            except Exception as exc:
                messages.error(request, f"Restore failed: {exc}")
                return render(request, "admin/ops/backuprun/restore.html", context)

            messages.warning(
                request,
                result.get("message")
                or "Restore completed. Please restart services.",
            )
            return HttpResponseRedirect(reverse("admin:ops_backuprun_changelist"))

        return render(request, "admin/ops/backuprun/restore.html", context)
