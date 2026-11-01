from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Ticket, TicketMessage
from .serializers import TicketSerializer, TicketMessageSerializer
from apps.notifications.service import NotificationService


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['subject', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority']

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.select_related('created_by', 'assigned_to').prefetch_related('messages', 'files')
        if user.is_supervisor:
            return qs.all()
        return qs.filter(created_by=user)

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        ticket = serializer.save(created_by=self.request.user)
        NotificationService.notify_supervisors('new_ticket', ticket)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        user = request.user
        is_internal = request.data.get('is_internal', False)
        if is_internal and not user.is_supervisor:
            is_internal = False
        msg = TicketMessage.objects.create(
            ticket=ticket,
            author=user,
            content=request.data.get('content', ''),
            is_internal=is_internal,
        )
        ticket.updated_at = timezone.now()
        if ticket.status == Ticket.Status.RESOLVED:
            ticket.status = Ticket.Status.OPEN
        ticket.save()
        # Notify the other party
        if user.is_supervisor:
            NotificationService.notify_user(ticket.created_by, 'ticket_replied', {'subject': ticket.subject}, ticket)
        else:
            NotificationService.notify_supervisors('ticket_replied_by_customer', ticket)
        return Response(TicketMessageSerializer(msg, context={'request': request}).data, status=201)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Ticket.Status.choices):
            return Response({'error': 'Invalid status.'}, status=400)
        ticket.status = new_status
        if new_status == Ticket.Status.RESOLVED:
            ticket.resolved_at = timezone.now()
        ticket.save()
        return Response(TicketSerializer(ticket, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not request.user.is_supervisor:
            return Response({'error': 'Not authorized.'}, status=403)
        ticket = self.get_object()
        agent_id = request.data.get('agent_id')
        try:
            agent = User.objects.get(id=agent_id)
            ticket.assigned_to = agent
            ticket.status = Ticket.Status.IN_PROGRESS
            ticket.save()
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
        return Response(TicketSerializer(ticket, context={'request': request}).data)
