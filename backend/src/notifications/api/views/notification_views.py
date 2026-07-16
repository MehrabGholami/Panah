from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.base import HasPermission
from notifications.api.serializers.notification_serializers import NotificationSerializer
from notifications.application.services.notification_service import NotificationService


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "notifications.view"
    filterset_fields = ["channel", "resource_type"]
    ordering_fields = ["created_at", "read_at"]

    def get_queryset(self):
        queryset = NotificationService().list_for_user(self.request.user.pk)
        unread_only = self.request.query_params.get("unread")
        if unread_only in ("1", "true", "True"):
            queryset = queryset.filter(read_at__isnull=True)
        since = self.request.query_params.get("since")
        if since:
            queryset = queryset.filter(created_at__gt=since)
        return queryset


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "notifications.view"

    def post(self, request, id):
        notification = NotificationService().mark_read(id, request.user.pk)
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "notifications.view"

    def post(self, request):
        count = NotificationService().mark_all_read(request.user.pk)
        return Response({"marked_read": count})


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "notifications.view"

    def get(self, request):
        count = NotificationService().unread_count(request.user.pk)
        return Response({"unread_count": count})
