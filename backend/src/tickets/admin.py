from django.contrib import admin

from tickets.models import Ticket, TicketReply


class TicketReplyInline(admin.TabularInline):
    model = TicketReply
    extra = 0
    readonly_fields = ("created_at",)
    raw_id_fields = ("author",)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "author", "opened_by", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "description", "author__email")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("author", "opened_by")
    inlines = [TicketReplyInline]


@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ("ticket", "author", "is_staff_reply", "created_at")
    list_filter = ("is_staff_reply",)
    search_fields = ("body", "author__email", "ticket__title")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("ticket", "author")
