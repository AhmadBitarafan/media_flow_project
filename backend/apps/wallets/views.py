from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

from .models import Wallet, WalletTransaction, Payment, Invoice
from .serializers import (
    WalletSerializer, WalletTransactionSerializer,
    PaymentSerializer, InvoiceSerializer, AdminAdjustmentSerializer,
)
from apps.notifications.service import NotificationService

User = get_user_model()


class MyWalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        return wallet


class WalletTransactionListView(generics.ListAPIView):
    serializer_class = WalletTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        return wallet.transactions.all()


class AdminWalletAdjustView(generics.GenericAPIView):
    serializer_class = AdminAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        from apps.projects.permissions import IsAdminOrSupervisor
        return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            user = User.objects.get(id=data['user_id'])
            wallet, _ = Wallet.objects.get_or_create(user=user)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        if data['type'] == 'credit':
            tx = wallet.credit(
                amount=data['amount'],
                description=data['description'],
                created_by=request.user
            )
        else:
            try:
                tx = wallet.debit(
                    amount=data['amount'],
                    description=data['description'],
                    created_by=request.user
                )
            except ValueError as e:
                return Response({'error': str(e)}, status=400)

        NotificationService.notify_user(
            user, 'wallet_adjusted',
            {'type': data['type'], 'amount': str(data['amount']), 'description': data['description']},
            related_object=tx
        )
        return Response(WalletTransactionSerializer(tx).data, status=201)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return Payment.objects.select_related('customer', 'project').all()
        return Payment.objects.filter(customer=user)

    def perform_create(self, serializer):
        payment = serializer.save(customer=self.request.user)
        # In production, integrate with gateway here
        # For now, simulate instant completion for wallet method
        if payment.method == Payment.Method.WALLET:
            try:
                wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
                wallet.debit(payment.amount, f'Payment for project', created_by=self.request.user)
                payment.status = Payment.Status.COMPLETED
                payment.save()
                self._generate_invoice(payment)
            except ValueError as e:
                payment.status = Payment.Status.FAILED
                payment.save()

    def _generate_invoice(self, payment):
        invoice_number = f'INV-{timezone.now().strftime("%Y%m")}-{str(payment.id)[:8].upper()}'
        Invoice.objects.create(
            invoice_number=invoice_number,
            customer=payment.customer,
            project=payment.project,
            payment=payment,
            amount=payment.amount,
            total_amount=payment.amount,
            currency=payment.currency,
            status=Invoice.Status.PAID,
            paid_at=timezone.now(),
        )

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Admin marks payment as completed manually."""
        if not request.user.is_supervisor:
            return Response({'error': 'Not authorized.'}, status=403)
        payment = self.get_object()
        payment.status = Payment.Status.COMPLETED
        payment.processed_by = request.user
        payment.save()
        self._generate_invoice(payment)
        # Credit freelancer wallet
        if payment.project:
            assignment = payment.project.assignments.filter(
                status__in=['active', 'completed']
            ).first()
            if assignment:
                wallet, _ = Wallet.objects.get_or_create(user=assignment.freelancer)
                wallet.credit(
                    payment.amount * 0.8,  # 80% to freelancer
                    f'Payment for project: {payment.project.title}',
                    reference=str(payment.id),
                    created_by=request.user
                )
        return Response(PaymentSerializer(payment).data)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return Invoice.objects.select_related('customer', 'project').all()
        return Invoice.objects.filter(customer=user)
