from django.contrib import admin
from .models import Ticket, TicketMessage

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['subject', 'created_by', 'status', 'priority', 'category', 'created_at']
    list_filter = ['status', 'priority', 'category']
    search_fields = ['subject', 'created_by__email']

@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'author', 'is_internal', 'created_at']
