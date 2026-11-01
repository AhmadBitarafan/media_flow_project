import uuid
from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class Wallet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='USD')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallets'

    def __str__(self):
        return f'Wallet: {self.user.get_full_name()} - {self.balance} {self.currency}'

    def credit(self, amount, description='', reference=None, created_by=None):
        self.balance += Decimal(str(amount))
        self.save()
        return WalletTransaction.objects.create(
            wallet=self, type=WalletTransaction.Type.CREDIT, amount=amount,
            balance_after=self.balance, description=description,
            reference=reference, created_by=created_by
        )

    def debit(self, amount, description='', reference=None, created_by=None):
        if self.balance < Decimal(str(amount)):
            raise ValueError('Insufficient wallet balance.')
        self.balance -= Decimal(str(amount))
        self.save()
        return WalletTransaction.objects.create(
            wallet=self, type=WalletTransaction.Type.DEBIT, amount=amount,
            balance_after=self.balance, description=description,
            reference=reference, created_by=created_by
        )


class WalletTransaction(models.Model):
    class Type(models.TextChoices):
        CREDIT = 'credit', 'Credit'
        DEBIT = 'debit', 'Debit'
        REFUND = 'refund', 'Refund'
        ADJUSTMENT = 'adjustment', 'Admin Adjustment'
        PAYMENT = 'payment', 'Payment'
        WITHDRAWAL = 'withdrawal', 'Withdrawal'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=Type.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    description = models.CharField(max_length=500, blank=True)
    reference = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wallet_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.type} {self.amount} for {self.wallet.user.email}'


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
        CANCELLED = 'cancelled', 'Cancelled'

    class Method(models.TextChoices):
        CARD = 'card', 'Credit/Debit Card'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        PAYPAL = 'paypal', 'PayPal'
        STRIPE = 'stripe', 'Stripe'
        WALLET = 'wallet', 'Wallet Balance'
        MANUAL = 'manual', 'Manual (Admin)'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='payments')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.CARD)
    gateway_reference = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='processed_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']


class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='invoices')
    payment = models.OneToOneField(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoice')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def __str__(self):
        return f'Invoice {self.invoice_number} - {self.customer.email}'
