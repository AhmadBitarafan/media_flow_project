from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'resource_repr', 'ip_address', 'created_at']
    list_filter = ['action', 'resource_type']
    search_fields = ['user__email', 'resource_repr']
    readonly_fields = ['created_at']
