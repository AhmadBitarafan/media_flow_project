from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import FreelancerProfile, CustomerProfile, FreelancerLevel

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'avatar': user.avatar.url if user.avatar else None,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[
        (User.Role.CUSTOMER, 'Customer'),
        (User.Role.FREELANCER, 'Freelancer'),
    ], default=User.Role.CUSTOMER)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password2', 'role', 'phone']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class FreelancerLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreelancerLevel
        fields = ['id', 'code', 'name', 'rank', 'description', 'min_rating']


class FreelancerProfileSerializer(serializers.ModelSerializer):
    level = FreelancerLevelSerializer(read_only=True)
    level_id = serializers.PrimaryKeyRelatedField(
        queryset=FreelancerLevel.objects.all(), source='level', write_only=True, required=False
    )

    class Meta:
        model = FreelancerProfile
        fields = [
            'id', 'level', 'level_id', 'bio', 'skills', 'portfolio_url',
            'years_experience', 'verification_status', 'can_accept_projects',
            'average_rating', 'total_projects', 'completed_projects',
            'verification_notes', 'created_at',
        ]
        read_only_fields = ['verification_status', 'can_accept_projects', 'average_rating',
                            'total_projects', 'completed_projects']


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['id', 'company_name', 'industry', 'website', 'address', 'total_projects']
        read_only_fields = ['total_projects']


class FreelancerLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreelancerLevel
        fields = ['id', 'code', 'name', 'rank', 'min_rating', 'description']


class UserSerializer(serializers.ModelSerializer):
    freelancer_profile = FreelancerProfileSerializer(read_only=True)
    customer_profile = CustomerProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'role',
            'phone', 'avatar', 'is_active', 'date_joined',
            'sms_notifications', 'email_notifications',
            'freelancer_profile', 'customer_profile',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'avatar', 'sms_notifications', 'email_notifications']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """For admin operations on users."""
    freelancer_profile = FreelancerProfileSerializer(read_only=True)
    customer_profile = CustomerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'phone',
            'avatar', 'is_active', 'date_joined', 'last_login',
            'freelancer_profile', 'customer_profile',
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login']
