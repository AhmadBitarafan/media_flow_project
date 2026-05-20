from django.urls import path
from .views import AuditLogListView, DashboardStatsView

urlpatterns = [
    path('logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
