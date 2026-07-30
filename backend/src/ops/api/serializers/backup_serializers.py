from rest_framework import serializers

from ops.models import BackupRun


class BackupRunSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, allow_null=True)

    class Meta:
        model = BackupRun
        fields = (
            "id",
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
            "actor_email",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class BackupScheduleSerializer(serializers.Serializer):
    enabled = serializers.BooleanField(required=False)
    frequency = serializers.ChoiceField(
        choices=["daily", "weekly", "monthly"], required=False
    )
    hour = serializers.IntegerField(min_value=0, max_value=23, required=False)
    minute = serializers.IntegerField(min_value=0, max_value=59, required=False)
    weekday = serializers.IntegerField(min_value=0, max_value=6, required=False)
    day_of_month = serializers.IntegerField(min_value=1, max_value=28, required=False)
    retention_days = serializers.IntegerField(min_value=1, max_value=365, required=False)
    schedule_summary = serializers.CharField(required=False, read_only=True)


class BackupStatusSerializer(serializers.Serializer):
    last_backup_status = serializers.CharField(allow_null=True)
    last_backup_at = serializers.CharField(allow_null=True)
    last_backup_age_hours = serializers.FloatField(allow_null=True)
    last_backup_size_bytes = serializers.IntegerField()
    last_run_id = serializers.CharField(allow_null=True)
    last_run_error = serializers.CharField(allow_blank=True)
    retention_days = serializers.IntegerField()
    database_name = serializers.CharField(allow_blank=True)
    schedule = BackupScheduleSerializer(required=False)


class BackupRestoreRequestSerializer(serializers.Serializer):
    confirm_db_name = serializers.CharField(max_length=128)
    restore_media = serializers.BooleanField(required=False, default=False)


class BackupRestoreResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    database = serializers.CharField()
    db_file = serializers.CharField()
    media_file = serializers.CharField(allow_blank=True)
    post_steps = serializers.ListField(child=serializers.CharField())
