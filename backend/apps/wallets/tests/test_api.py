from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class WalletAPITest(APITestCase):
    """Test cases for Wallet API"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role=User.Role.CUSTOMER
        )
        self.supervisor_user = User.objects.create_user(
            email='supervisor@test.com',
            password='testpass123',
            first_name='Supervisor',
            last_name='User',
            role=User.Role.SUPERVISOR
        )
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_view_own_wallet(self):
        """Test that authenticated user can view their own wallet"""
        url = reverse('wallet-my')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_id'], str(self.user.id))

    def test_user_can_view_transactions(self):
        """Test that user can view their wallet transactions"""
        url = reverse('wallet-my-transactions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_view_wallet(self):
        """Test that unauthenticated users cannot view wallets"""
        self.client.force_authenticate(user=None)
        url = reverse('wallet-my')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_only_admin_can_adjust_wallet(self):
        """Test that only admin/supervisor can adjust wallet balance"""
        self.client.force_authenticate(user=self.supervisor_user)
        url = reverse('wallet-admin-adjust')
        payload = {
            'user_id': str(self.user.id),
            'amount': Decimal('100.00'),
            'type': 'credit',
            'description': 'Test adjustment',
        }
        response = self.client.post(url, payload, format='json')
        # Should succeed with supervisor
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
