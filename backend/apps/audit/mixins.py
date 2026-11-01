from .models import AuditLog


def get_client_ip(request):
    x = request.META.get('HTTP_X_FORWARDED_FOR')
    return x.split(',')[0].strip() if x else request.META.get('REMOTE_ADDR')


class AuditMixin:
    """ViewSet mixin — auto-logs create/update/delete actions."""

    def perform_create(self, serializer):
        instance = serializer.save()
        self._audit('create', instance)
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        self._audit('update', instance)
        return instance

    def perform_destroy(self, instance):
        self._audit('delete', instance)
        instance.delete()

    def _audit(self, action, instance):
        request = getattr(self, 'request', None)
        user = request.user if request and request.user.is_authenticated else None
        AuditLog.objects.create(
            user=user,
            action=action,
            resource_type=instance.__class__.__name__,
            resource_id=str(getattr(instance, 'id', '') or getattr(instance, 'pk', '')),
            resource_repr=str(instance)[:300],
            ip_address=get_client_ip(request) if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:300] if request else '',
        )
