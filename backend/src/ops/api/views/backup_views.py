from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.exceptions.api_exceptions import PermissionDeniedError, ValidationError
from common.permissions.base import HasPermission
from ops.api.serializers.backup_serializers import (
    BackupRestoreRequestSerializer,
    BackupRestoreResponseSerializer,
    BackupRunSerializer,
    BackupScheduleSerializer,
    BackupStatusSerializer,
)
from ops.application.services.backup_service import BackupService
from ops.application.services.backup_settings_service import BackupSettingsService
from ops.domain.enums import BackupStatus, BackupTriggeredBy
from ops.models import BackupRun
from ops.tasks import run_manual_backup


class BackupRunListView(generics.ListAPIView):
    serializer_class = BackupRunSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "ops.view_backups"
    filterset_fields = ["status", "backup_type", "triggered_by"]
    ordering_fields = ["started_at", "finished_at", "size_bytes", "status"]
    ordering = ["-started_at"]

    def get_queryset(self):
        return BackupRun.objects.select_related("actor").all()


class BackupRunDetailView(generics.RetrieveAPIView):
    serializer_class = BackupRunSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "ops.view_backups"
    lookup_field = "id"
    queryset = BackupRun.objects.select_related("actor").all()


class BackupStatusView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "ops.view_backups"

    def get(self, request):
        summary = BackupService().get_status_summary()
        return Response(BackupStatusSerializer(summary).data)


class BackupSettingsView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]

    def get_permissions(self):
        self.required_permission = (
            "ops.run_backup" if self.request.method in {"PUT", "PATCH"} else "ops.view_backups"
        )
        return super().get_permissions()

    def get(self, request):
        data = BackupSettingsService().to_dict()
        return Response(BackupScheduleSerializer(data).data)

    def put(self, request):
        return self._update(request)

    def patch(self, request):
        return self._update(request)

    def _update(self, request):
        serializer = BackupScheduleSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        obj = BackupSettingsService().update(actor=request.user, **serializer.validated_data)
        return Response(BackupScheduleSerializer(BackupSettingsService().to_dict(obj)).data)


class BackupRunTriggerView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "ops.run_backup"

    def post(self, request):
        async_mode = str(request.data.get("async", "1")).lower() in {"1", "true", "yes"}
        if async_mode:
            async_result = run_manual_backup.delay(str(request.user.pk))
            return Response(
                {"queued": True, "task_id": async_result.id},
                status=status.HTTP_202_ACCEPTED,
            )

        run = BackupService().run_full_backup(
            triggered_by=BackupTriggeredBy.MANUAL,
            actor=request.user,
        )
        return Response(BackupRunSerializer(run).data, status=status.HTTP_201_CREATED)


class BackupRestoreView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "ops.run_backup"

    def post(self, request, id):
        if not request.user.is_superuser:
            raise PermissionDeniedError("فقط سوپریوزر می‌تواند ری‌استور اجرا کند.")

        run = BackupRun.objects.filter(pk=id).first()
        if not run:
            raise ValidationError("بکاپ موردنظر یافت نشد.")
        if run.status != BackupStatus.SUCCESS or not run.db_path:
            raise ValidationError("فقط بکاپ‌های موفق دارای فایل پایگاه‌داده قابل ری‌استور هستند.")

        serializer = BackupRestoreRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        result = BackupService().restore_database(
            run.db_path,
            confirm_db_name=payload["confirm_db_name"],
            actor=request.user,
            restore_media=bool(payload.get("restore_media")),
            media_file=run.media_path or None,
        )
        response_payload = {
            **result,
            "post_steps": [
                "سرویس‌های backend و celery را restart کنید.",
                "در صورت نیاز: python manage.py migrate",
                "دوباره وارد سامانه شوید؛ نشست قبلی ممکن است منقضی شده باشد.",
            ],
        }
        return Response(BackupRestoreResponseSerializer(response_payload).data)
