from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, FreelancerProfile, CustomerProfile, FreelancerLevel


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Notifications', {'fields': ('email_notifications', 'sms_notifications')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(FreelancerLevel)
class FreelancerLevelAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'rank', 'min_rating', 'is_active']
    ordering = ['rank']


@admin.register(FreelancerProfile)
class FreelancerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'verification_status', 'can_accept_projects', 'average_rating']
    list_filter = ['verification_status', 'level', 'can_accept_projects']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'industry', 'total_projects']
    search_fields = ['user__email', 'company_name']
