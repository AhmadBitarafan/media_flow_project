from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import FreelancerProfile, CustomerProfile, FreelancerLevel
from .serializers import (
    CustomTokenObtainPairSerializer, RegisterSerializer,
    UserSerializer, UserUpdateSerializer, ChangePasswordSerializer,
    FreelancerProfileSerializer, CustomerProfileSerializer,
    AdminUserSerializer, FreelancerLevelSerializer,
)
from apps.audit.mixins import AuditMixin

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully.'})


class FreelancerProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FreelancerProfileSerializer

    def get_object(self):
        profile, _ = FreelancerProfile.objects.get_or_create(user=self.request.user)
        return profile


class CustomerProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CustomerProfileSerializer

    def get_object(self):
        profile, _ = CustomerProfile.objects.get_or_create(user=self.request.user)
        return profile


class FreelancerLevelListView(generics.ListAPIView):
    queryset = FreelancerLevel.objects.filter(is_active=True)
    serializer_class = FreelancerLevelSerializer
    permission_classes = [permissions.IsAuthenticated]


# Admin Views
class AdminUserViewSet(AuditMixin, viewsets.ModelViewSet):
    """Admin management of all users."""
    serializer_class = AdminUserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login']

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsSupervisorOrAdmin()]

    def get_queryset(self):
        return User.objects.select_related('freelancer_profile', 'customer_profile').all()

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})

    @action(detail=True, methods=['post'])
    def verify_freelancer(self, request, pk=None):
        user = self.get_object()
        if user.role != User.Role.FREELANCER:
            return Response({'error': 'User is not a freelancer.'}, status=400)
        action_type = request.data.get('action', 'approve')
        notes = request.data.get('notes', '')
        profile, _ = FreelancerProfile.objects.get_or_create(user=user)
        if action_type == 'approve':
            profile.verification_status = FreelancerProfile.Status.APPROVED
            profile.can_accept_projects = True
        elif action_type == 'reject':
            profile.verification_status = FreelancerProfile.Status.REJECTED
            profile.can_accept_projects = False
        elif action_type == 'suspend':
            profile.verification_status = FreelancerProfile.Status.SUSPENDED
            profile.can_accept_projects = False
        profile.verification_notes = notes
        profile.verified_by = request.user
        profile.verified_at = timezone.now()
        profile.save()
        return Response(FreelancerProfileSerializer(profile).data)

    @action(detail=True, methods=['post'])
    def set_freelancer_level(self, request, pk=None):
        user = self.get_object()
        level_id = request.data.get('level_id')
        try:
            level = FreelancerLevel.objects.get(id=level_id)
            profile, _ = FreelancerProfile.objects.get_or_create(user=user)
            profile.level = level
            profile.save()
            return Response({'message': f'Level set to {level.name}'})
        except FreelancerLevel.DoesNotExist:
            return Response({'error': 'Level not found.'}, status=400)


class IsSupervisorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_supervisor
