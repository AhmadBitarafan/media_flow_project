import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    class Type(models.TextChoices):
        PROJECT_ASSIGNED = 'project_assigned', 'Project Assigned'
        PROJECT_STATUS_UPDATED = 'project_status_updated', 'Project Status Updated'
        PROJECT_REQUEST_REVIEWED = 'project_request_reviewed', 'Project Request Reviewed'
        REVISION_REQUESTED = 'revision_requested', 'Revision Requested'
        REVISION_REVIEWED = 'revision_reviewed', 'Revision Reviewed'
        DELIVERY_APPROVED = 'delivery_approved', 'Delivery Approved'
        TICKET_REPLIED = 'ticket_replied', 'Ticket Replied'
        NEW_TICKET = 'new_ticket', 'New Ticket'
        PAYMENT_STATUS = 'payment_status', 'Payment Status Changed'
        WALLET_ADJUSTED = 'wallet_adjusted', 'Wallet Adjusted'
        FILE_UPLOADED = 'file_uploaded', 'File Uploaded'
        NEW_PROJECT_REQUEST = 'new_project_request', 'New Project Request'
        GENERAL = 'general', 'General'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=40, choices=Type.choices, default=Type.GENERAL)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    related_object_id = models.CharField(max_length=100, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'Notification for {self.recipient.email}: {self.title}'
