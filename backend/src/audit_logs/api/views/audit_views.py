from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from audit_logs.api.filters import AuditLogFilterSet
from audit_logs.api.serializers.audit_serializers import AuditLogSerializer
from audit_logs.models import AuditLog
from common.permissions.base import HasPermission


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "audit.view"
    queryset = AuditLog.objects.all()
    filterset_class = AuditLogFilterSet
    ordering_fields = ["created_at", "action", "resource_type"]
    ordering = ["-created_at"]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        logs = page if page is not None else list(queryset)

        user_ids = {log.user_id for log in logs if log.user_id}
        users = (
            User.objects.filter(id__in=user_ids)
            .prefetch_related("user_roles__role")
            .only("id", "email", "first_name", "last_name")
        )
        user_map = {user.id: user for user in users}

        context = self.get_serializer_context()
        context["user_map"] = user_map
        serializer = self.get_serializer(logs, many=True, context=context)

        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
