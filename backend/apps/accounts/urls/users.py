from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.accounts.views import (
    FreelancerProfileView, CustomerProfileView,
    FreelancerLevelListView, AdminUserViewSet,
)

router = DefaultRouter()
router.register('admin', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/freelancer/', FreelancerProfileView.as_view(), name='freelancer_profile'),
    path('profile/customer/', CustomerProfileView.as_view(), name='customer_profile'),
    path('freelancer-levels/', FreelancerLevelListView.as_view(), name='freelancer_levels'),
]
