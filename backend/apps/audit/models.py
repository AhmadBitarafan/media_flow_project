import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'create', 'Created'
        UPDATE = 'update', 'Updated'
        DELETE = 'delete', 'Deleted'
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        ASSIGN = 'assign', 'Assigned'
        APPROVE = 'approve', 'Approved'
        REJECT = 'reject', 'Rejected'
        UPLOAD = 'upload', 'Uploaded'
        DOWNLOAD = 'download', 'Downloaded'
        PAYMENT = 'payment', 'Payment'
        STATUS_CHANGE = 'status_change', 'Status Changed'
        VIEW = 'view', 'Viewed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=Action.choices)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100, blank=True)
    resource_repr = models.CharField(max_length=300, blank=True)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    extra = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        user = self.user.email if self.user else 'Anonymous'
        return f'{user} {self.action} {self.resource_type} at {self.created_at}'
