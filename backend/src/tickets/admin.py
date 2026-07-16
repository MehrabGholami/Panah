from django.contrib import admin

from tickets.models import Ticket, TicketReply

admin.site.register(Ticket)
admin.site.register(TicketReply)
