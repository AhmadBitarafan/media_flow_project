from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Project, ProjectRequest

User = get_user_model()


class ProjectRequestAPITest(APITestCase):
    """Test cases for Project Request ViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer_user = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            first_name='Customer',
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
        self.client.force_authenticate(user=self.customer_user)
        self.list_url = reverse('project-requests-list')

    def test_customer_can_create_project_request(self):
        """Test that authenticated customer can create a project request"""
        payload = {
            'project_type': 'video_production',
            'title': 'Test Project Request',
            'description': 'This is a test project request',
            'requirements': 'Test requirements',
            'budget_max': 1000.00,
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProjectRequest.objects.count(), 1)
        self.assertEqual(ProjectRequest.objects.first().customer, self.customer_user)

    def test_customer_can_list_own_requests(self):
        """Test that customer can list their own project requests"""
        ProjectRequest.objects.create(
            customer=self.customer_user,
            project_type='video_production',
            title='Test Request',
            description='Test Description',
            requirements='Test Requirements',
        )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)

    def test_unauthenticated_cannot_create_request(self):
        """Test that unauthenticated users cannot create requests"""
        self.client.force_authenticate(user=None)
        payload = {
            'project_type': 'video_production',
            'title': 'Test',
            'description': 'Test',
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_supervisor_can_view_all_requests(self):
        """Test that supervisor can view all project requests"""
        ProjectRequest.objects.create(
            customer=self.customer_user,
            project_type='video_production',
            title='Test Request',
            description='Test',
            requirements='Test',
        )
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ProjectAPITest(APITestCase):
    """Test cases for Project ViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer_user = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            first_name='Customer',
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
        self.freelancer_user = User.objects.create_user(
            email='freelancer@test.com',
            password='testpass123',
            first_name='Freelancer',
            last_name='User',
            role=User.Role.FREELANCER
        )
        self.client.force_authenticate(user=self.supervisor_user)
        self.list_url = reverse('projects-list')

    def test_supervisor_can_create_project(self):
        """Test that supervisor can create a project"""
        payload = {
            'customer_id': str(self.customer_user.id),
            'project_type': 'video_production',
            'title': 'Test Project',
            'description': 'Test Description',
            'requirements': 'Test Requirements',
            'budget': 5000.00,
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 1)

    def test_customer_can_list_own_projects(self):
        """Test that customer can list their own projects"""
        Project.objects.create(
            customer=self.customer_user,
            project_type='video_production',
            title='Test Project',
            description='Test',
            created_by=self.supervisor_user,
        )
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)

    def test_project_retrieval_returns_200(self):
        """Test that project retrieval returns 200"""
        project = Project.objects.create(
            customer=self.customer_user,
            project_type='video_production',
            title='Test Project',
            description='Test',
            created_by=self.supervisor_user,
        )
        url = reverse('projects-detail', args=[project.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(project.id))

    def test_unauthenticated_cannot_list_projects(self):
        """Test that unauthenticated users cannot list projects"""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
