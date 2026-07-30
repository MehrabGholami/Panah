from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.permissions.base import HasPermission
from disasters.api.serializers.disaster_serializers import DisasterSerializer
from disasters.application.services.disaster_service import DisasterService


class DisasterListCreateView(generics.ListCreateAPIView):
    serializer_class = DisasterSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filterset_fields = ["severity", "status", "disaster_type"]
    search_fields = ["title", "location", "description", "province", "city"]
    ordering_fields = ["created_at", "severity", "status", "occurred_at"]

    def get_queryset(self):
        qs = DisasterService().list()
        params = getattr(self.request, "query_params", self.request.GET)
        occurred_after = (params.get("occurred_after") or "").strip()
        if occurred_after:
            # Crises that occurred on/after the selected date.
            # If occurred_at is empty, fall back to created_at.
            qs = qs.filter(
                Q(occurred_at__date__gte=occurred_after)
                | Q(occurred_at__isnull=True, created_at__date__gte=occurred_after)
            )
        return qs

    def get_required_permission(self):
        if self.request.method == "POST":
            return "disasters.create"
        return "disasters.view"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def perform_create(self, serializer):
        disaster = DisasterService().create(**serializer.validated_data)
        serializer.instance = disaster


class DisasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DisasterSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    lookup_field = "id"

    def get_queryset(self):
        return DisasterService().list()

    def get_required_permission(self):
        if self.request.method == "GET":
            return "disasters.view"
        return "disasters.update"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def perform_update(self, serializer):
        disaster = DisasterService().update(self.kwargs["id"], **serializer.validated_data)
        serializer.instance = disaster

    def perform_destroy(self, instance):
        DisasterService().delete(instance.id)
