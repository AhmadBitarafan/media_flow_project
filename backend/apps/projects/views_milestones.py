from rest_framework import viewsets, permissions
from .models import ProjectMilestone
from .serializers import ProjectMilestoneSerializer


class ProjectMilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProjectMilestone.objects.filter(project_id=self.kwargs['project_pk'])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_pk'])
