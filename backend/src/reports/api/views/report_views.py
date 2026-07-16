from django.db.models import Q
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.base import HasPermission
from reports.api.serializers.report_serializers import (
    MissionReportCreateSerializer,
    MissionReportSerializer,
)
from reports.application.services.finished_mission_report_service import (
    FinishedMissionReportService,
)
from reports.application.services.report_service import ReportService


class ReportListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, HasPermission]
    filterset_fields = ["status", "mission"]
    ordering_fields = ["created_at", "status"]

    def get_queryset(self):
        return ReportService().list()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MissionReportCreateSerializer
        return MissionReportSerializer

    def get_required_permission(self):
        if self.request.method == "POST":
            return "reports.submit"
        return "reports.view"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def perform_create(self, serializer):
        report = ReportService().create(author_id=self.request.user.pk, **serializer.validated_data)
        serializer.instance = report


class FinishedMissionListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "reports.view"

    def get(self, request):
        service = FinishedMissionReportService()
        queryset = service.list_finished_missions()
        search = (request.query_params.get("search") or "").strip()
        status_filter = (request.query_params.get("status") or "").strip()
        if status_filter in ("completed", "closed"):
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(disaster__title__icontains=search)
                | Q(city__icontains=search)
                | Q(province__icontains=search)
            )

        from common.pagination import StandardPagination

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        data = [service.build_list_item(mission) for mission in page]
        return paginator.get_paginated_response(data)


class FinishedMissionDetailView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "reports.view"

    def get(self, request, id):
        service = FinishedMissionReportService()
        mission = service.get_finished_mission(id)
        return Response(service.build_summary(mission))


class ReportDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = MissionReportSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    lookup_field = "id"

    def get_queryset(self):
        return ReportService().list()

    def get_required_permission(self):
        if self.request.method == "GET":
            return "reports.view"
        return "reports.submit"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def perform_update(self, serializer):
        report = ReportService().update(self.kwargs["id"], **serializer.validated_data)
        serializer.instance = report


class ReportSubmitView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "reports.submit"

    def post(self, request, id):
        report = ReportService().submit(id)
        return Response(MissionReportSerializer(report).data)


class ReportReviewView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "reports.view"

    def post(self, request, id):
        report = ReportService().review(id)
        return Response(MissionReportSerializer(report).data)


class ReportAttachmentView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "reports.submit"
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, id):
        file = request.FILES.get("file")
        if not file:
            from common.exceptions.api_exceptions import ValidationError

            raise ValidationError("File is required.")
        report = ReportService().add_attachment(id, file)
        return Response(MissionReportSerializer(report).data, status=status.HTTP_201_CREATED)
