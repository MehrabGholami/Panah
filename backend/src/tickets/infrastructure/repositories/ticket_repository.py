from __future__ import annotations

from common.repositories.base_repository import BaseRepository
from tickets.models import Ticket, TicketReply


class TicketRepository(BaseRepository[Ticket]):
    model = Ticket

    def list_with_relations(self, author_id=None):
        queryset = self.model.objects.select_related(
            "author",
            "opened_by",
        ).prefetch_related("replies__author")
        if author_id is not None:
            queryset = queryset.filter(author_id=author_id)
        return queryset.order_by("-created_at")

    def get_with_relations(self, ticket_id):
        return (
            self.model.objects.select_related("author", "opened_by")
            .prefetch_related("replies__author")
            .filter(pk=ticket_id)
            .first()
        )


class TicketReplyRepository(BaseRepository[TicketReply]):
    model = TicketReply

    def list_for_ticket(self, ticket_id):
        return (
            self.model.objects.select_related("author")
            .filter(ticket_id=ticket_id)
            .order_by("created_at")
        )
