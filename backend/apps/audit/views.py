from rest_framework import generics, permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from .models import AuditLog

User = get_user_model()


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user_email', 'action', 'action_display', 'resource_type',
                  'resource_id', 'resource_repr', 'changes', 'ip_address', 'created_at']

    def get_user_email(self, obj):
        return obj.user.email if obj.user else 'Anonymous'


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'resource_type']
    search_fields = ['resource_repr', 'user__email']
    ordering_fields = ['created_at']

    def get_permissions(self):
        from apps.projects.permissions import IsAdminOrSupervisor
        return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]

    def get_queryset(self):
        return AuditLog.objects.select_related('user').all()


class DashboardStatsView(APIView):
    """Admin dashboard stats overview."""
    def get_permissions(self):
        from apps.projects.permissions import IsAdminOrSupervisor
        return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]

    def get(self, request):
        from apps.projects.models import Project, ProjectRequest
        from apps.tickets.models import Ticket
        from apps.wallets.models import Payment
        from apps.accounts.models import FreelancerProfile

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        stats = {
            'projects': {
                'total': Project.objects.count(),
                'active': Project.objects.filter(status__in=['assigned', 'in_progress', 'review', 'revision']).count(),
                'completed': Project.objects.filter(status='completed').count(),
                'pending': Project.objects.filter(status='pending').count(),
            },
            'requests': {
                'total': ProjectRequest.objects.count(),
                'pending_review': ProjectRequest.objects.filter(status__in=['submitted', 'under_review']).count(),
            },
            'tickets': {
                'open': Ticket.objects.filter(status__in=['open', 'in_progress']).count(),
                'resolved_this_month': Ticket.objects.filter(
                    status='resolved', resolved_at__gte=thirty_days_ago
                ).count(),
            },
            'freelancers': {
                'total': User.objects.filter(role='freelancer').count(),
                'approved': FreelancerProfile.objects.filter(verification_status='approved').count(),
                'pending': FreelancerProfile.objects.filter(verification_status='pending').count(),
            },
            'customers': {
                'total': User.objects.filter(role='customer').count(),
                'new_this_month': User.objects.filter(role='customer', date_joined__gte=thirty_days_ago).count(),
            },
            'payments': {
                'completed_this_month': Payment.objects.filter(
                    status='completed', created_at__gte=thirty_days_ago
                ).count(),
            },
        }
        return Response(stats)
