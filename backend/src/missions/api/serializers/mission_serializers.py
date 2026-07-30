from rest_framework import serializers

from missions.models import Mission, MissionApplication, MissionCoordinatorRequest, MissionRequiredSkill
from skills.models import Skill


class MissionRequiredSkillSerializer(serializers.ModelSerializer):
    skill_id = serializers.UUIDField(source="skill.id", read_only=True)
    skill_name = serializers.CharField(source="skill.name", read_only=True)
    skill_category = serializers.CharField(source="skill.category", read_only=True)

    class Meta:
        model = MissionRequiredSkill
        fields = ("id", "skill_id", "skill_name", "skill_category", "is_required")
        read_only_fields = fields


class MissionApplicationSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.SerializerMethodField()
    volunteer_email = serializers.EmailField(source="volunteer.user.email", read_only=True)
    mission_title = serializers.CharField(source="mission.title", read_only=True)

    class Meta:
        model = MissionApplication
        fields = (
            "id",
            "mission",
            "mission_title",
            "volunteer",
            "volunteer_name",
            "volunteer_email",
            "message",
            "status",
            "reviewed_by",
            "reviewed_at",
            "review_note",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_volunteer_name(self, obj):
        user = obj.volunteer.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email


class MissionApplicationCreateSerializer(serializers.Serializer):
    message = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class MissionApplicationReviewSerializer(serializers.Serializer):
    review_note = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class MissionSerializer(serializers.ModelSerializer):
    disaster_title = serializers.CharField(source="disaster.title", read_only=True)
    coordinator_email = serializers.EmailField(source="coordinator.email", read_only=True)
    coordinator_name = serializers.SerializerMethodField()
    location_display = serializers.CharField(read_only=True)
    required_skills = MissionRequiredSkillSerializer(many=True, read_only=True)
    required_skill_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
    )
    applications_count = serializers.SerializerMethodField()
    pending_applications_count = serializers.SerializerMethodField()
    assignments_count = serializers.SerializerMethodField()
    user_has_applied = serializers.SerializerMethodField()
    user_application_status = serializers.SerializerMethodField()
    user_coordinator_request_status = serializers.SerializerMethodField()
    pending_coordinator_requests_count = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()
    is_current_user_coordinator = serializers.SerializerMethodField()

    class Meta:
        model = Mission
        fields = (
            "id",
            "disaster",
            "disaster_title",
            "title",
            "description",
            "coordinator",
            "coordinator_email",
            "coordinator_name",
            "status",
            "priority",
            "province",
            "city",
            "location",
            "location_display",
            "start_time",
            "end_time",
            "is_end_time_tba",
            "required_volunteers",
            "special_considerations",
            "equipment_needed",
            "safety_notes",
            "is_visible_to_volunteers",
            "allow_volunteer_applications",
            "metadata",
            "required_skills",
            "required_skill_ids",
            "applications_count",
            "pending_applications_count",
            "assignments_count",
            "user_has_applied",
            "user_application_status",
            "user_coordinator_request_status",
            "pending_coordinator_requests_count",
            "can_manage",
            "is_current_user_coordinator",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "status",
            "disaster_title",
            "coordinator_email",
            "coordinator_name",
            "location_display",
            "required_skills",
            "applications_count",
            "pending_applications_count",
            "assignments_count",
            "user_has_applied",
            "user_application_status",
            "user_coordinator_request_status",
            "pending_coordinator_requests_count",
            "can_manage",
            "is_current_user_coordinator",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            # Resolved in MissionListCreateView.perform_create when omitted.
            "coordinator": {"required": False},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            self.fields["coordinator"].read_only = True
            return

        role_slugs = set(
            request.user.user_roles.values_list("role__slug", flat=True)
        )
        if "admin" not in role_slugs:
            self.fields["coordinator"].read_only = True

    def validate(self, attrs):
        is_tba = attrs.get("is_end_time_tba")
        if is_tba is None and self.instance:
            is_tba = self.instance.is_end_time_tba
        if is_tba:
            attrs["end_time"] = None
            attrs["is_end_time_tba"] = True
        return attrs

    def get_coordinator_name(self, obj):
        full_name = f"{obj.coordinator.first_name} {obj.coordinator.last_name}".strip()
        return full_name or obj.coordinator.email

    def get_applications_count(self, obj):
        return getattr(obj, "applications_count", obj.applications.count())

    def get_pending_applications_count(self, obj):
        from missions.domain.enums import MissionApplicationStatus

        if hasattr(obj, "pending_applications_count"):
            return obj.pending_applications_count
        return obj.applications.filter(status=MissionApplicationStatus.SUBMITTED).count()

    def get_assignments_count(self, obj):
        return getattr(obj, "assignments_count", obj.assignments.count())

    def get_user_has_applied(self, obj):
        status = self.get_user_application_status(obj)
        if not status:
            return False
        from missions.domain.enums import MissionApplicationStatus

        return status in (
            MissionApplicationStatus.SUBMITTED,
            MissionApplicationStatus.WAITLIST,
            MissionApplicationStatus.APPROVED,
        )

    def get_user_application_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        volunteer = getattr(request.user, "volunteer_profile", None)
        if not volunteer:
            return None

        application = (
            obj.applications.filter(volunteer=volunteer)
            .order_by("-created_at")
            .first()
        )
        return application.status if application else None

    def get_user_coordinator_request_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        coord_request = (
            obj.coordinator_requests.filter(requester=request.user)
            .order_by("-created_at")
            .first()
        )
        return coord_request.status if coord_request else None

    def get_pending_coordinator_requests_count(self, obj):
        from missions.domain.enums import MissionCoordinatorRequestStatus

        if hasattr(obj, "pending_coordinator_requests_count"):
            return obj.pending_coordinator_requests_count
        return obj.coordinator_requests.filter(
            status=MissionCoordinatorRequestStatus.SUBMITTED
        ).count()

    def get_can_manage(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        from missions.application.services.mission_service import MissionService

        return MissionService().can_manage_mission(request.user, obj)

    def get_is_current_user_coordinator(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return str(obj.coordinator_id) == str(request.user.pk)


class MissionCoordinatorRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()
    requester_email = serializers.EmailField(source="requester.email", read_only=True)
    mission_title = serializers.CharField(source="mission.title", read_only=True)
    disaster_title = serializers.CharField(
        source="mission.disaster.title", read_only=True
    )
    current_coordinator_name = serializers.SerializerMethodField()

    class Meta:
        model = MissionCoordinatorRequest
        fields = (
            "id",
            "mission",
            "mission_title",
            "disaster_title",
            "requester",
            "requester_name",
            "requester_email",
            "current_coordinator_name",
            "message",
            "status",
            "reviewed_by",
            "reviewed_at",
            "review_note",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_requester_name(self, obj):
        user = obj.requester
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email

    def get_current_coordinator_name(self, obj):
        coordinator = obj.mission.coordinator
        full_name = f"{coordinator.first_name} {coordinator.last_name}".strip()
        return full_name or coordinator.email


class MissionCoordinatorRequestCreateSerializer(serializers.Serializer):
    message = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class MissionAssignCoordinatorSerializer(serializers.Serializer):
    coordinator = serializers.UUIDField()
    review_note = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class MissionVisibilitySerializer(serializers.Serializer):
    is_visible_to_volunteers = serializers.BooleanField(required=False)
    allow_volunteer_applications = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one visibility field is required.")
        visible = attrs.get("is_visible_to_volunteers")
        allow_apply = attrs.get("allow_volunteer_applications")
        if allow_apply is True and visible is False:
            raise serializers.ValidationError(
                "Applications cannot be enabled while the mission is hidden from volunteers."
            )
        return attrs
