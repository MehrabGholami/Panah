from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from assignments.api.serializers.assignment_serializers import (
    AssignmentCreateSerializer,
    AssignmentSerializer,
    AssignmentTaskCreateSerializer,
    AssignmentTaskSerializer,
    AssignmentTaskStatusSerializer,
    AssignmentTaskUpdateSerializer,
    get_idempotent_response,
    store_idempotent_response,
)
from assignments.application.services.assignment_service import AssignmentService
from assignments.application.services.assignment_task_service import AssignmentTaskService
from common.permissions.base import HasPermission


class AssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filterset_fields = ["status", "mission", "volunteer"]
    ordering_fields = ["created_at", "status"]

    def get_queryset(self):
        return AssignmentService().list()

    def get_required_permission(self):
        if self.request.method == "POST":
            return "assignments.manage"
        return "assignments.view"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def create(self, request, *args, **kwargs):
        serializer = AssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = AssignmentService().assign(
            serializer.validated_data["mission_id"],
            serializer.validated_data["volunteer_id"],
        )
        output = AssignmentSerializer(assignment).data
        return Response(output, status=status.HTTP_201_CREATED)


class AssignmentDetailView(generics.RetrieveAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "assignments.view"
    lookup_field = "id"

    def get_queryset(self):
        return AssignmentService().list()


class AssignmentActionView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "assignments.manage"
    action_method = ""
    cache_prefix = ""

    def patch(self, request, id):
        cache_prefix = f"{self.cache_prefix}:{id}"
        _, cached = get_idempotent_response(request, cache_prefix)
        if cached:
            return Response(cached["data"], status=cached["status"])

        service = AssignmentService()
        assignment = getattr(service, self.action_method)(id)
        data = AssignmentSerializer(assignment).data
        store_idempotent_response(request, cache_prefix, data, status.HTTP_200_OK)
        return Response(data)

    def post(self, request, id):
        return self.patch(request, id)


class AssignmentAcceptView(AssignmentActionView):
    action_method = "accept"
    cache_prefix = "assignment:accept"
    required_permission = "assignments.accept"


class AssignmentDeclineView(AssignmentActionView):
    action_method = "decline"
    cache_prefix = "assignment:decline"
    required_permission = "assignments.decline"


class AssignmentMyListView(generics.ListAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "assignments.view"

    def get_queryset(self):
        return AssignmentService().list_for_user(self.request.user)


class AssignmentCheckInView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "assignments.manage"

    def post(self, request, id):
        assignment = AssignmentService().check_in(id)
        return Response(AssignmentSerializer(assignment).data)


class AssignmentCompleteView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "assignments.manage"

    def post(self, request, id):
        assignment = AssignmentService().complete(id)
        return Response(AssignmentSerializer(assignment).data)


class AssignmentTaskListCreateView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]

    def get_required_permission(self):
        if self.request.method == "POST":
            return "assignments.manage_tasks"
        return "assignments.view"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def get(self, request, id):
        tasks = AssignmentTaskService().list_for_assignment(id, request.user)
        return Response(AssignmentTaskSerializer(tasks, many=True).data)

    def post(self, request, id):
        serializer = AssignmentTaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = AssignmentTaskService().create(
            id,
            request.user,
            title=serializer.validated_data["title"],
            description=serializer.validated_data.get("description", ""),
        )
        return Response(AssignmentTaskSerializer(task).data, status=status.HTTP_201_CREATED)


class AssignmentTaskDetailView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "assignments.manage_tasks"

    def patch(self, request, task_id):
        serializer = AssignmentTaskUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        task = AssignmentTaskService().update(
            task_id,
            request.user,
            title=serializer.validated_data.get("title"),
            description=serializer.validated_data.get("description"),
        )
        return Response(AssignmentTaskSerializer(task).data)

    def delete(self, request, task_id):
        AssignmentTaskService().delete(task_id, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssignmentTaskStatusView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "assignments.report_task"

    def patch(self, request, task_id):
        serializer = AssignmentTaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = AssignmentTaskService().report_status(
            task_id,
            request.user,
            status=serializer.validated_data["status"],
        )
        return Response(AssignmentTaskSerializer(task).data)
