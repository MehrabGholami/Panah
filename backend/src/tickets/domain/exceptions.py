from common.exceptions.api_exceptions import NotFoundError


class TicketNotFoundError(NotFoundError):
    default_detail = "Ticket not found."
