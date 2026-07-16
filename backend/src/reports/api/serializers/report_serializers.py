from rest_framework import serializers

from reports.models import MissionReport, ReportAttachment


class ReportAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportAttachment
        fields = ("id", "file", "created_at")
        read_only_fields = ("id", "created_at")


class MissionReportSerializer(serializers.ModelSerializer):
    attachments = ReportAttachmentSerializer(many=True, read_only=True)
    mission_title = serializers.CharField(source="mission.title", read_only=True)
    author_email = serializers.EmailField(source="author.email", read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = MissionReport
        fields = (
            "id",
            "mission",
            "mission_title",
            "author",
            "author_name",
            "author_email",
            "content",
            "status",
            "attachments",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "author",
            "author_name",
            "author_email",
            "mission_title",
            "status",
            "attachments",
            "created_at",
            "updated_at",
        )

    def get_author_name(self, obj):
        user = obj.author
        if not user:
            return None
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email


class MissionReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissionReport
        fields = ("mission", "content")


class FinishedMissionListSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()
    disaster_title = serializers.CharField(allow_null=True, required=False)
    coordinator_name = serializers.CharField(allow_null=True, required=False)
    coordinator_email = serializers.EmailField(allow_null=True, required=False)
    location_display = serializers.CharField(allow_blank=True, required=False)
    start_time = serializers.DateTimeField(allow_null=True, required=False)
    end_time = serializers.DateTimeField(allow_null=True, required=False)
    required_volunteers = serializers.IntegerField()
    applications_total = serializers.IntegerField()
    applications_approved = serializers.IntegerField()
    assignments_total = serializers.IntegerField()
    assignments_completed = serializers.IntegerField()
    assignments_checked_in = serializers.IntegerField()
    reports_total = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
