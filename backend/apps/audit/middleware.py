from .models import AuditLog


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class AuditLogMiddleware:
    """Records login/logout events from JWT endpoints."""
    TRACKED_PATHS = ['/api/auth/login/', '/api/auth/logout/', '/api/auth/register/']

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path in self.TRACKED_PATHS and response.status_code in [200, 201]:
            action = 'login' if 'login' in request.path else ('logout' if 'logout' in request.path else 'create')
            user = request.user if request.user.is_authenticated else None
            AuditLog.objects.create(
                user=user,
                action=action,
                resource_type='Auth',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:300],
            )
        return response


class AuditMixin:
    """Mixin for ViewSets to auto-log create/update/delete."""
    def perform_create(self, serializer):
        instance = serializer.save()
        self._log('create', instance)
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log('update', instance)
        return instance

    def perform_destroy(self, instance):
        self._log('delete', instance)
        instance.delete()

    def _log(self, action, instance):
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
