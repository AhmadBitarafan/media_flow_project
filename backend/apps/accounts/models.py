import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        SUPERVISOR = 'supervisor', 'Supervisor'
        CUSTOMER = 'customer', 'Customer'
        FREELANCER = 'freelancer', 'Freelancer'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    sms_notifications = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.get_full_name()} <{self.email}>'

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_supervisor(self):
        return self.role in [self.Role.ADMIN, self.Role.SUPERVISOR]

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_freelancer(self):
        return self.role == self.Role.FREELANCER


class FreelancerLevel(models.Model):
    """Quality levels for freelancers. Extensible by adding rows."""
    code = models.CharField(max_length=10, unique=True)  # A, B, C...
    name = models.CharField(max_length=50)  # Gold, Silver, Bronze
    rank = models.PositiveIntegerField(unique=True)  # 1=highest
    description = models.TextField(blank=True)
    min_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'freelancer_levels'
        ordering = ['rank']

    def __str__(self):
        return f'Level {self.code} - {self.name}'


class FreelancerProfile(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Verification'
        UNDER_REVIEW = 'under_review', 'Under Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='freelancer_profile')
    level = models.ForeignKey(FreelancerLevel, on_delete=models.SET_NULL, null=True, blank=True)
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list)
    portfolio_url = models.URLField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    verification_status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    can_accept_projects = models.BooleanField(default=False)
    id_document = models.FileField(upload_to='freelancer_docs/', null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='verified_freelancers')
    verified_at = models.DateTimeField(null=True, blank=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_projects = models.PositiveIntegerField(default=0)
    completed_projects = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'freelancer_profiles'

    def __str__(self):
        return f'Freelancer: {self.user.get_full_name()} [{self.level}]'

    def can_view_project_level(self, project_level_code):
        """Level A sees A,B,C; B sees B,C; C sees C only."""
        if not self.level:
            return False
        visibility_map = {
            'A': ['A', 'B', 'C'],
            'B': ['B', 'C'],
            'C': ['C'],
        }
        allowed = visibility_map.get(self.level.code, [self.level.code])
        return project_level_code in allowed


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    company_name = models.CharField(max_length=200, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    address = models.TextField(blank=True)
    total_projects = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_profiles'

    def __str__(self):
        return f'Customer: {self.user.get_full_name()}'
