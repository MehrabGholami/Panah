from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from tickets.domain.enums import TicketStatus


class Ticket(BaseModel):
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices(),
        default=TicketStatus.OPEN,
        db_index=True,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tickets",
    )
    # Staff member who opened a direct message; author is the recipient.
    opened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tickets_opened",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "tickets_ticket"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"


class TicketReply(BaseModel):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="replies",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ticket_replies",
    )
    body = models.TextField()
    is_staff_reply = models.BooleanField(default=False)

    class Meta:
        db_table = "tickets_reply"
        ordering = ["created_at"]
        verbose_name = "Ticket reply"
        verbose_name_plural = "Ticket replies"

    def __str__(self):
        return f"Reply on {self.ticket_id} by {self.author_id}"
