from django.urls import path

from tickets.api.views.ticket_views import (
    TicketDetailView,
    TicketListCreateView,
    TicketReplyListCreateView,
    TicketStatusUpdateView,
)

urlpatterns = [
    path("", TicketListCreateView.as_view(), name="ticket-list-create"),
    path("<uuid:id>/", TicketDetailView.as_view(), name="ticket-detail"),
    path("<uuid:id>/replies/", TicketReplyListCreateView.as_view(), name="ticket-replies"),
    path("<uuid:id>/status/", TicketStatusUpdateView.as_view(), name="ticket-status"),
]
