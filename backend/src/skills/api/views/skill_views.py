from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.base import HasPermission
from skills.api.serializers.skill_serializers import (
    AssignSkillSerializer,
    SkillSerializer,
    VolunteerSkillSerializer,
)
from skills.application.services.skill_service import SkillService


class PublicSkillListView(generics.ListAPIView):
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):
        return SkillService().list()


class SkillListCreateView(generics.ListCreateAPIView):
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filterset_fields = ["category"]
    search_fields = ["name", "category", "description"]
    ordering_fields = ["name", "category", "created_at"]

    def get_queryset(self):
        return SkillService().list()

    def get_required_permission(self):
        if self.request.method == "POST":
            return "skills.manage"
        return "skills.view"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def perform_create(self, serializer):
        skill = SkillService().create(**serializer.validated_data)
        serializer.instance = skill


class SkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    lookup_field = "id"

    def get_queryset(self):
        return SkillService().list()

    def get_required_permission(self):
        if self.request.method == "GET":
            return "skills.view"
        return "skills.manage"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def perform_update(self, serializer):
        skill = SkillService().update(self.kwargs["id"], **serializer.validated_data)
        serializer.instance = skill

    def perform_destroy(self, instance):
        SkillService().delete(instance.id)


class VolunteerSkillListView(generics.ListAPIView):
    serializer_class = VolunteerSkillSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "skills.view"

    def get_queryset(self):
        return SkillService().list_volunteer_skills(self.kwargs["volunteer_id"])


class VolunteerSkillAssignView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "skills.manage"

    def post(self, request, volunteer_id):
        serializer = AssignSkillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        volunteer_skill = SkillService().assign_to_volunteer(
            volunteer_id,
            serializer.validated_data["skill_id"],
            serializer.validated_data["proficiency"],
        )
        return Response(
            VolunteerSkillSerializer(volunteer_skill).data,
            status=status.HTTP_201_CREATED,
        )
