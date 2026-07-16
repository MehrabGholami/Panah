from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.base import HasPermission
from tickets.api.serializers.ticket_serializers import (
    TicketCreateSerializer,
    TicketReplyCreateSerializer,
    TicketReplySerializer,
    TicketSerializer,
    TicketStatusUpdateSerializer,
)
from tickets.application.services.ticket_service import TicketService


class TicketListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, HasPermission]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "status"]

    def get_queryset(self):
        return TicketService().list_for_user(self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TicketCreateSerializer
        return TicketSerializer

    def get_required_permission(self):
        if self.request.method == "POST":
            return "tickets.create"
        return "tickets.view"

    @property
    def required_permission(self):
        return self.get_required_permission()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        recipient_id = data.pop("recipient_id", None)
        ticket = TicketService().create(
            request.user,
            recipient_id=recipient_id,
            **data,
        )
        output = TicketSerializer(ticket, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class TicketDetailView(generics.RetrieveAPIView):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "tickets.view"
    lookup_field = "id"

    def get_object(self):
        return TicketService().get_for_user(self.request.user, self.kwargs["id"])


class TicketReplyListCreateView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "tickets.view"

    def get(self, request, id):
        replies = TicketService().list_replies(request.user, id)
        return Response(TicketReplySerializer(replies, many=True).data)

    def post(self, request, id):
        serializer = TicketReplyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = TicketService().add_reply(
            request.user,
            id,
            body=serializer.validated_data["body"],
        )
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class TicketStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "tickets.reply"

    def patch(self, request, id):
        serializer = TicketStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = TicketService().update_status(
            request.user,
            id,
            status=serializer.validated_data["status"],
        )
        return Response(TicketSerializer(ticket).data)
