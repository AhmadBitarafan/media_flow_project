from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdminOrSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_supervisor


class IsCustomerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_customer or request.user.is_supervisor
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_supervisor:
            return True
        return getattr(obj, 'customer', None) == request.user


class IsFreelancerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_freelancer or request.user.is_supervisor
        )


class IsProjectParticipant(permissions.BasePermission):
    """Customer, assigned freelancer, or admin can access."""
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_supervisor:
            return True
        if obj.customer == user:
            return True
        # Check if freelancer is assigned
        return obj.assignments.filter(freelancer=user).exists()
