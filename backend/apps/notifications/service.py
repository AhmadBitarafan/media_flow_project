from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

NOTIFICATION_TEMPLATES = {
    'project_assigned': {
        'title': 'New Project Assigned',
        'message': 'You have been assigned to project: {project_title}',
    },
    'project_status_updated': {
        'title': 'Project Status Updated',
        'message': 'Project "{project_title}" status changed to {status}.',
    },
    'project_request_reviewed': {
        'title': 'Your Project Request Was Reviewed',
        'message': 'Your request has been {status}. {notes}',
    },
    'revision_requested': {
        'title': 'Revision Requested',
        'message': 'A revision has been requested for project: {project_title} (Revision #{revision_number})',
    },
    'delivery_approved': {
        'title': 'Delivery Approved!',
        'message': 'The customer approved the delivery for project: {project_title}',
    },
    'ticket_replied': {
        'title': 'Ticket Reply',
        'message': 'Your ticket "{subject}" has a new reply.',
    },
    'new_ticket': {
        'title': 'New Support Ticket',
        'message': 'A new ticket has been submitted.',
    },
    'new_project_request': {
        'title': 'New Project Request',
        'message': 'A new project request has been submitted and needs review.',
    },
    'wallet_adjusted': {
        'title': 'Wallet Balance Updated',
        'message': 'Your wallet has been {type}ed by {amount}. Note: {description}',
    },
    'ticket_replied_by_customer': {
        'title': 'Customer Replied to Ticket',
        'message': 'A customer has replied to a ticket.',
    },
}


class NotificationService:
    @staticmethod
    def notify_user(user, notification_type, context=None, related_object=None):
        """Send a notification to a single user."""
        context = context or {}
        template = NOTIFICATION_TEMPLATES.get(notification_type, {
            'title': notification_type.replace('_', ' ').title(),
            'message': str(context),
        })
        try:
            title = template['title']
            message = template['message'].format(**context)
        except (KeyError, IndexError):
            title = template.get('title', 'Notification')
            message = template.get('message', '')

        related_id = ''
        related_type = ''
        if related_object:
            related_id = str(getattr(related_object, 'id', '') or getattr(related_object, 'pk', ''))
            related_type = related_object.__class__.__name__

        notif = Notification.objects.create(
            recipient=user,
            type=notification_type,
            title=title,
            message=message,
            data=context,
            related_object_id=related_id,
            related_object_type=related_type,
        )

        # Trigger email/SMS if user has them enabled
        NotificationService._dispatch_channels(user, notif)
        return notif

    @staticmethod
    def notify_supervisors(notification_type, related_object=None, context=None):
        """Notify all active supervisors and admins."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        supervisors = User.objects.filter(
            role__in=[User.Role.ADMIN, User.Role.SUPERVISOR], is_active=True
        )
        for sup in supervisors:
            NotificationService.notify_user(sup, notification_type, context, related_object)

    @staticmethod
    def notify_assignment_freelancer(project, notification_type, context=None):
        """Notify the currently active freelancer on a project."""
        from apps.projects.models import ProjectAssignment
        assignment = project.assignments.filter(
            status__in=['assigned', 'accepted', 'active']
        ).select_related('freelancer').first()
        if assignment:
            NotificationService.notify_user(assignment.freelancer, notification_type, context, project)

    @staticmethod
    def _dispatch_channels(user, notification):
        """Dispatch to email/SMS adapters based on user preferences."""
        if user.email_notifications:
            NotificationService._send_email(user, notification)
        if user.sms_notifications:
            NotificationService._send_sms(user, notification)

    @staticmethod
    def _send_email(user, notification):
        """Send email notification (placeholder — use Celery task in production)."""
        try:
            from django.core.mail import send_mail
            send_mail(
                subject=f'[MediaFlow] {notification.title}',
                message=notification.message,
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

    @staticmethod
    def _send_sms(user, notification):
        """Delegate to pluggable SMS backend."""
        try:
            from django.conf import settings
            from importlib import import_module
            backend_path = settings.SMS_BACKEND
            module_path, class_name = backend_path.rsplit('.', 1)
            module = import_module(module_path)
            backend_cls = getattr(module, class_name)
            backend = backend_cls()
            backend.send(user.phone, notification.message)
        except Exception:
            pass
