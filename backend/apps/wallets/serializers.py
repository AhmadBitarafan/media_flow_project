from rest_framework import serializers
from .models import Wallet, WalletTransaction, Payment, Invoice


class WalletTransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = WalletTransaction
        fields = ['id', 'type', 'type_display', 'amount', 'balance_after', 'description', 'reference', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'currency', 'is_active', 'transactions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'balance', 'is_active']


class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'currency', 'status', 'status_display',
            'method', 'method_display', 'gateway_reference', 'notes',
            'project', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'gateway_reference', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'amount', 'tax_amount', 'total_amount',
            'currency', 'status', 'status_display', 'description',
            'project', 'due_date', 'paid_at', 'created_at',
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at']


class AdminAdjustmentSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    type = serializers.ChoiceField(choices=['credit', 'debit'])
    description = serializers.CharField(max_length=500)
