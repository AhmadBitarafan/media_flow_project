from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Ticket

User = get_user_model()


class TicketAPITest(APITestCase):
    """Test cases for Ticket ViewSet"""
    
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
        self.list_url = reverse('ticket-list')

    def test_authenticated_user_can_create_ticket(self):
        """Test that authenticated user can create a ticket"""
        payload = {
            'subject': 'Test Ticket',
            'description': 'This is a test ticket',
            'category': 'general',
            'priority': 'medium',
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ticket.objects.count(), 1)
        self.assertEqual(Ticket.objects.first().created_by, self.user)

    def test_user_can_list_tickets(self):
        """Test that users can list tickets"""
        Ticket.objects.create(
            created_by=self.user,
            subject='Test Ticket',
            description='Test Description',
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ticket_retrieval_returns_200(self):
        """Test that ticket retrieval returns 200"""
        ticket = Ticket.objects.create(
            created_by=self.user,
            subject='Test Ticket',
            description='Test Description',
        )
        url = reverse('ticket-detail', args=[ticket.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_create_ticket(self):
        """Test that unauthenticated users cannot create tickets"""
        self.client.force_authenticate(user=None)
        payload = {
            'subject': 'Test',
            'description': 'Test',
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
