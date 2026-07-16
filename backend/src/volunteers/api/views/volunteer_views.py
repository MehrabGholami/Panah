from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.base import HasPermission
from volunteers.api.serializers.volunteer_serializers import (
    VolunteerRegisterSerializer,
    VolunteerSerializer,
)
from volunteers.application.services.volunteer_service import VolunteerService


class VolunteerRegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = VolunteerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = VolunteerService().register(**serializer.validated_data)
        return Response(VolunteerSerializer(profile).data, status=status.HTTP_201_CREATED)


class VolunteerListView(generics.ListAPIView):
    serializer_class = VolunteerSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "volunteers.view"
    filterset_fields = ["status", "city"]
    search_fields = ["national_id", "city", "user__email", "user__first_name", "user__last_name"]
    ordering_fields = ["created_at", "status", "city"]

    def get_queryset(self):
        return VolunteerService().list()


class VolunteerDetailView(generics.RetrieveAPIView):
    serializer_class = VolunteerSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "volunteers.view"
    lookup_field = "id"

    def get_queryset(self):
        return VolunteerService().list()


class VolunteerApproveView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "volunteers.approve"

    def post(self, request, id):
        profile = VolunteerService().approve(id)
        return Response(VolunteerSerializer(profile).data)


class VolunteerRejectView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "volunteers.approve"

    def post(self, request, id):
        reason = request.data.get("reason", "")
        profile = VolunteerService().reject(id, reason=reason)
        return Response(VolunteerSerializer(profile).data)
