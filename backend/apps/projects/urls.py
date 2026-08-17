from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectRequestViewSet, ProjectViewSet, FreelancerDashboardView,
    ProjectRevisionViewSet, FreelancerBidViewSet
)
from .views_milestones import ProjectMilestoneViewSet

router = DefaultRouter()
router.register('requests', ProjectRequestViewSet, basename='project-requests')
router.register('revisions', ProjectRevisionViewSet, basename='project-revisions')
router.register('bids', FreelancerBidViewSet, basename='freelancer-bids')
router.register('', ProjectViewSet, basename='projects')

milestone_list = ProjectMilestoneViewSet.as_view({'get': 'list', 'post': 'create'})
milestone_detail = ProjectMilestoneViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'})

urlpatterns = [
    path('freelancer/dashboard/', FreelancerDashboardView.as_view(), name='freelancer-dashboard'),
    path('<uuid:project_pk>/milestones/', milestone_list, name='project-milestones-list'),
    path('<uuid:project_pk>/milestones/<uuid:pk>/', milestone_detail, name='project-milestones-detail'),
    path('', include(router.urls)),
]
