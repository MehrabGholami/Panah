from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.base import HasPermission
from missions.api.serializers.mission_serializers import (
    MissionApplicationCreateSerializer,
    MissionApplicationReviewSerializer,
    MissionApplicationSerializer,
    MissionSerializer,
    MissionVisibilitySerializer,
)
from missions.application.services.mission_service import MissionService


class MissionListCreateView(generics.ListCreateAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filterset_fields = ["status", "disaster", "priority", "is_visible_to_volunteers"]
    search_fields = ["title", "description", "location", "city", "province"]
    ordering_fields = ["created_at", "start_time", "status", "priority"]

    def get_queryset(self):
        qs = MissionService().list_for_user(self.request.user)
        params = getattr(self.request, "query_params", self.request.GET)
        mine = (params.get("mine") or "").strip().lower()
        if mine in {"1", "true", "yes"}:
            qs = qs.filter(coordinator_id=self.request.user.pk)
        return qs

    def get_required_permission(self):
        if self.request.method == "POST":
            return "missions.create"
        return "missions.view"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        validated = dict(serializer.validated_data)
        required_skill_ids = validated.pop("required_skill_ids", None)
        coordinator_value = validated.pop("coordinator", None)
        coordinator_id = getattr(coordinator_value, "pk", coordinator_value)
        service = MissionService()
        coordinator = service.resolve_coordinator(self.request.user, coordinator_id)
        mission = service.create(
            coordinator=coordinator,
            required_skill_ids=required_skill_ids,
            actor=self.request.user,
            **validated,
        )
        serializer.instance = mission


class MissionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    lookup_field = "id"

    def get_queryset(self):
        return MissionService().list_for_user(self.request.user)

    def get_object(self):
        return MissionService().get_for_user(self.kwargs["id"], self.request.user)

    def get_required_permission(self):
        if self.request.method == "GET":
            return "missions.view"
        return "missions.create"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_update(self, serializer):
        validated = dict(serializer.validated_data)
        required_skill_ids = validated.pop("required_skill_ids", None)
        mission = MissionService().update(
            self.kwargs["id"],
            required_skill_ids=required_skill_ids,
            actor=self.request.user,
            **validated,
        )
        serializer.instance = mission


class MissionTransitionView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.create"
    action_method = ""

    def post(self, request, id):
        service = MissionService()
        mission = getattr(service, self.action_method)(id)
        return Response(
            MissionSerializer(mission, context={"request": request}).data
        )


class MissionPublishView(MissionTransitionView):
    action_method = "publish"


class MissionStartView(MissionTransitionView):
    action_method = "start"


class MissionCompleteView(MissionTransitionView):
    action_method = "complete"


class MissionCloseView(MissionTransitionView):
    action_method = "close"


class MissionReopenView(MissionTransitionView):
    action_method = "reopen"
    required_permission = "missions.create"


class MissionVisibilityView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.create"

    def patch(self, request, id):
        serializer = MissionVisibilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mission = MissionService().update_visibility(id, **serializer.validated_data)
        return Response(
            MissionSerializer(mission, context={"request": request}).data
        )


class MissionApplyView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.apply"

    def post(self, request, id):
        serializer = MissionApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = MissionService().apply(
            id,
            request.user,
            message=serializer.validated_data.get("message", ""),
        )
        return Response(
            MissionApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class MissionApplicationListView(generics.ListAPIView):
    serializer_class = MissionApplicationSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.create"

    def get_queryset(self):
        return MissionService().list_applications(self.kwargs["id"])


class MissionApplicationApproveView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.create"

    def post(self, request, id, application_id):
        serializer = MissionApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = MissionService().approve_application(
            application_id,
            request.user,
            review_note=serializer.validated_data.get("review_note", ""),
        )
        return Response(MissionApplicationSerializer(application).data)


class MissionApplicationRejectView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.create"

    def post(self, request, id, application_id):
        serializer = MissionApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = MissionService().reject_application(
            application_id,
            request.user,
            review_note=serializer.validated_data.get("review_note", ""),
        )
        return Response(MissionApplicationSerializer(application).data)


class MissionApplicationWaitlistView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.create"

    def post(self, request, id, application_id):
        serializer = MissionApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = MissionService().waitlist_application(
            application_id,
            request.user,
            review_note=serializer.validated_data.get("review_note", ""),
        )
        return Response(MissionApplicationSerializer(application).data)


class MissionApplicationInboxView(generics.ListAPIView):
    serializer_class = MissionApplicationSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "missions.create"

    def get_queryset(self):
        from django.db.models import Q

        qs = MissionService().list_inbox_applications(self.request.user)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(volunteer__user__first_name__icontains=search)
                | Q(volunteer__user__last_name__icontains=search)
                | Q(volunteer__user__email__icontains=search)
                | Q(volunteer__user__phone__icontains=search)
                | Q(mission__title__icontains=search)
                | Q(message__icontains=search)
            ).distinct()
        return qs
