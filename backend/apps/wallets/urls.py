from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyWalletView, WalletTransactionListView, AdminWalletAdjustView, PaymentViewSet, InvoiceViewSet

router = DefaultRouter()
router.register('payments', PaymentViewSet, basename='payments')
router.register('invoices', InvoiceViewSet, basename='invoices')

urlpatterns = [
    path('my/', MyWalletView.as_view(), name='my-wallet'),
    path('my/transactions/', WalletTransactionListView.as_view(), name='wallet-transactions'),
    path('admin/adjust/', AdminWalletAdjustView.as_view(), name='wallet-adjust'),
    path('', include(router.urls)),
]
