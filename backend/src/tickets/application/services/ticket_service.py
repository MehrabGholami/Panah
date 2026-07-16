from __future__ import annotations

from accounts.domain.enums import SystemRole
from accounts.models import User
from common.exceptions.api_exceptions import PermissionDeniedError, ValidationError
from common.services.base_service import BaseService
from tickets.domain.enums import TicketStatus
from tickets.domain.exceptions import TicketNotFoundError
from tickets.infrastructure.repositories.ticket_repository import (
    TicketReplyRepository,
    TicketRepository,
)
from tickets.models import Ticket


class TicketService(BaseService):
    repository: TicketRepository

    def __init__(
        self,
        repository: TicketRepository | None = None,
        reply_repository: TicketReplyRepository | None = None,
    ):
        super().__init__(repository or TicketRepository())
        self.reply_repository = reply_repository or TicketReplyRepository()

    @staticmethod
    def _get_user_roles(user) -> list[str]:
        return list(
            user.user_roles.select_related("role").values_list("role__slug", flat=True)
        )

    @classmethod
    def is_staff_user(cls, user) -> bool:
        roles = cls._get_user_roles(user)
        return (
            user.is_superuser
            or SystemRole.ADMIN.value in roles
            or SystemRole.COORDINATOR.value in roles
        )

    def list_for_user(self, user):
        if self.is_staff_user(user):
            return self.repository.list_with_relations()
        return self.repository.list_with_relations(author_id=user.pk)

    def get_for_user(self, user, ticket_id) -> Ticket:
        ticket = self.repository.get_with_relations(ticket_id)
        if not ticket:
            raise TicketNotFoundError()
        if not self.is_staff_user(user) and ticket.author_id != user.pk:
            raise PermissionDeniedError("You do not have access to this ticket.")
        return ticket

    def create(self, user, *, recipient_id=None, **data) -> Ticket:
        author_id = user.pk
        opened_by_id = None

        if recipient_id is not None:
            if not self.is_staff_user(user):
                raise PermissionDeniedError("Only staff can message other users.")
            if str(recipient_id) == str(user.pk):
                raise ValidationError("Cannot send a message to yourself.")

            recipient = User.objects.filter(pk=recipient_id).first()
            if not recipient:
                raise ValidationError("Recipient not found.")
            if not recipient.is_active:
                raise ValidationError("Cannot send a message to a blocked user.")

            author_id = recipient.pk
            opened_by_id = user.pk

        ticket = self.repository.create(
            author_id=author_id,
            opened_by_id=opened_by_id,
            status=TicketStatus.OPEN,
            **data,
        )

        from notifications.application.services.notification_dispatcher import (
            NotificationDispatcher,
        )

        dispatcher = NotificationDispatcher()
        if opened_by_id:
            sender_name = f"{user.first_name} {user.last_name}".strip() or user.email
            dispatcher.notify_user(
                author_id,
                title="پیام جدید",
                message=f"«{sender_name}» برای شما پیامی با عنوان «{ticket.title}» ارسال کرد.",
                resource_type="ticket",
                resource_id=str(ticket.pk),
            )
        else:
            dispatcher.notify_roles(
                [SystemRole.ADMIN.value, SystemRole.COORDINATOR.value],
                title="تیکت جدید",
                message=f"تیکت جدید «{ticket.title}» توسط کاربر ثبت شد.",
                resource_type="ticket",
                resource_id=str(ticket.pk),
                exclude_user_ids={str(user.pk)},
            )
        return ticket

    def update_status(self, user, ticket_id, status: str) -> Ticket:
        if not self.is_staff_user(user):
            raise PermissionDeniedError("Only staff can update ticket status.")
        ticket = self.get_for_user(user, ticket_id)
        if status not in {s.value for s in TicketStatus}:
            raise ValidationError("Invalid ticket status.")
        updated = self.repository.update(ticket, status=status)
        if updated.author_id and updated.author_id != user.pk:
            from notifications.application.services.notification_dispatcher import (
                NotificationDispatcher,
            )

            NotificationDispatcher().notify_user(
                updated.author_id,
                title="به‌روزرسانی وضعیت تیکت",
                message=f"وضعیت تیکت «{updated.title}» به «{status}» تغییر کرد.",
                resource_type="ticket",
                resource_id=str(updated.pk),
            )
        return updated

    def add_reply(self, user, ticket_id, body: str) -> Ticket:
        ticket = self.get_for_user(user, ticket_id)
        if ticket.status == TicketStatus.CLOSED:
            raise ValidationError("Cannot reply to a closed ticket.")

        is_staff = self.is_staff_user(user)
        is_author = ticket.author_id == user.pk

        if not is_staff and not is_author:
            raise PermissionDeniedError("You cannot reply to this ticket.")

        self.reply_repository.create(
            ticket=ticket,
            author_id=user.pk,
            body=body,
            is_staff_reply=is_staff,
        )

        if is_staff:
            if ticket.status == TicketStatus.OPEN:
                ticket = self.repository.update(ticket, status=TicketStatus.IN_PROGRESS)
            if ticket.status == TicketStatus.IN_PROGRESS:
                ticket = self.repository.update(ticket, status=TicketStatus.ANSWERED)
        elif ticket.status == TicketStatus.ANSWERED:
            ticket = self.repository.update(ticket, status=TicketStatus.OPEN)

        from notifications.application.services.notification_dispatcher import (
            NotificationDispatcher,
        )

        dispatcher = NotificationDispatcher()
        if is_staff and ticket.author_id and ticket.author_id != user.pk:
            dispatcher.notify_user(
                ticket.author_id,
                title="پاسخ جدید به پیام",
                message=f"پاسخ جدیدی برای «{ticket.title}» ثبت شد.",
                resource_type="ticket",
                resource_id=str(ticket.pk),
            )
        elif is_author:
            dispatcher.notify_roles(
                [SystemRole.ADMIN.value, SystemRole.COORDINATOR.value],
                title="پاسخ کاربر",
                message=f"کاربر به «{ticket.title}» پاسخ داد.",
                resource_type="ticket",
                resource_id=str(ticket.pk),
                exclude_user_ids={str(user.pk)},
            )

        return self.repository.get_with_relations(ticket.pk)

    def list_replies(self, user, ticket_id):
        ticket = self.get_for_user(user, ticket_id)
        return self.reply_repository.list_for_ticket(ticket.pk)
