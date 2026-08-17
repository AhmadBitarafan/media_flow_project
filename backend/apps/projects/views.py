from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import (
    ProjectRequest, Project, ProjectAssignment,
    ProjectStatusHistory, ProjectMilestone, ProjectRevision, FreelancerBid
)
from .serializers import (
    ProjectRequestSerializer, ProjectSerializer, ProjectCreateSerializer,
    ProjectAssignmentSerializer, ProjectMilestoneSerializer,
    ProjectRevisionSerializer, FreelancerBidSerializer,
)
from .permissions import IsAdminOrSupervisor, IsCustomerOrAdmin, IsProjectParticipant
from apps.audit.mixins import AuditMixin
from apps.notifications.service import NotificationService

User = get_user_model()


class ProjectRequestViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = ProjectRequestSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'project_type']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline']

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return ProjectRequest.objects.select_related('customer', 'reviewed_by').all()
        return ProjectRequest.objects.filter(customer=user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user, status=ProjectRequest.Status.SUBMITTED)
        NotificationService.notify_supervisors('new_project_request', serializer.instance)

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsCustomerOrAdmin()]
        return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminOrSupervisor])
    def review(self, request, pk=None):
        req = self.get_object()
        action_type = request.data.get('action', 'approve')
        notes = request.data.get('notes', '')
        req.review_notes = notes
        req.reviewed_by = request.user
        req.reviewed_at = timezone.now()
        if action_type == 'approve':
            req.status = ProjectRequest.Status.APPROVED
        elif action_type == 'reject':
            req.status = ProjectRequest.Status.REJECTED
        req.save()
        NotificationService.notify_user(
            req.customer,
            'project_request_reviewed',
            {'status': req.status, 'notes': notes},
            related_object=req
        )
        return Response(ProjectRequestSerializer(req, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminOrSupervisor])
    def convert_to_project(self, request, pk=None):
        req = self.get_object()
        if req.status != ProjectRequest.Status.APPROVED:
            return Response({'error': 'Request must be approved first.'}, status=400)
        level_id = request.data.get('required_level_id')
        from apps.accounts.models import FreelancerLevel
        level = None
        if level_id:
            try:
                level = FreelancerLevel.objects.get(id=level_id)
            except FreelancerLevel.DoesNotExist:
                pass
        project = Project.objects.create(
            request=req,
            customer=req.customer,
            title=req.title,
            description=req.description,
            project_type=req.project_type,
            budget=req.budget_max,
            deadline=req.deadline,
            required_level=level,
            created_by=request.user,
        )
        req.status = ProjectRequest.Status.CONVERTED
        req.save()
        ProjectStatusHistory.objects.create(
            project=project, to_status=project.status, changed_by=request.user, note='Project created from request'
        )
        return Response(ProjectSerializer(project, context={'request': request}).data, status=201)


class ProjectViewSet(AuditMixin, viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'project_type', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'priority']

    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return Project.objects.select_related(
                'customer', 'required_level', 'created_by'
            ).prefetch_related('assignments', 'status_history', 'milestones', 'revisions', 'files').all()
        elif user.is_freelancer:
            # Projects assigned to this freelancer OR open projects they can see by level
            try:
                profile = user.freelancer_profile
                level_code = profile.level.code if profile.level else None
            except Exception:
                level_code = None

            accessible_levels = []
            if level_code:
                level_map = {'A': ['A', 'B', 'C'], 'B': ['B', 'C'], 'C': ['C']}
                accessible_levels = level_map.get(level_code, [])

            return Project.objects.filter(
                Q(assignments__freelancer=user) |
                Q(is_public_to_level=True, required_level__code__in=accessible_levels)
            ).distinct().prefetch_related('assignments', 'milestones', 'revisions', 'files')
        else:
            return Project.objects.filter(customer=user).prefetch_related(
                'assignments', 'milestones', 'revisions', 'files'
            )

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsCustomerOrAdmin()]
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Override to return full ProjectSerializer after creation."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(created_by=request.user)
        ProjectStatusHistory.objects.create(
            project=project, to_status=project.status, changed_by=request.user
        )
        # Return full detail representation
        output = ProjectSerializer(
            Project.objects.prefetch_related(
                'assignments', 'status_history', 'milestones', 'revisions', 'files'
            ).get(pk=project.pk),
            context={'request': request}
        )
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        pass  # handled in create()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminOrSupervisor])
    def assign(self, request, pk=None):
        project = self.get_object()
        freelancer_id = request.data.get('freelancer_id')
        notes = request.data.get('notes', '')
        try:
            freelancer = User.objects.get(id=freelancer_id, role=User.Role.FREELANCER)
        except User.DoesNotExist:
            return Response({'error': 'Freelancer not found.'}, status=400)

        # Deactivate previous assignments
        ProjectAssignment.objects.filter(
            project=project, status__in=[ProjectAssignment.Status.ASSIGNED, ProjectAssignment.Status.ACTIVE]
        ).update(status=ProjectAssignment.Status.REMOVED)

        assignment = ProjectAssignment.objects.create(
            project=project, freelancer=freelancer,
            assigned_by=request.user, notes=notes
        )
        old_status = project.status
        project.status = Project.Status.ASSIGNED
        project.save()

        ProjectStatusHistory.objects.create(
            project=project, from_status=old_status,
            to_status=project.status, changed_by=request.user,
            note=f'Assigned to {freelancer.get_full_name()}'
        )
        NotificationService.notify_user(
            freelancer, 'project_assigned',
            {'project_title': project.title}, related_object=project
        )
        return Response(ProjectAssignmentSerializer(assignment, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        project = self.get_object()
        user = request.user
        new_status = request.data.get('status')
        note = request.data.get('note', '')

        allowed = {
            'freelancer': [Project.Status.IN_PROGRESS, Project.Status.REVIEW],
            'supervisor': list(Project.Status.values),
            'admin': list(Project.Status.values),
        }
        user_role = user.role
        if user_role not in allowed or new_status not in allowed.get(user_role, []):
            # freelancers can update their own assigned project
            if user.is_freelancer:
                if not project.assignments.filter(freelancer=user, status=ProjectAssignment.Status.ACTIVE).exists():
                    return Response({'error': 'Not authorized.'}, status=403)
                if new_status not in [Project.Status.IN_PROGRESS, Project.Status.REVIEW]:
                    return Response({'error': 'Invalid status transition.'}, status=400)
            elif not user.is_supervisor:
                return Response({'error': 'Not authorized.'}, status=403)

        old_status = project.status
        project.status = new_status
        if new_status == Project.Status.COMPLETED:
            project.completed_at = timezone.now()
        project.save()

        ProjectStatusHistory.objects.create(
            project=project, from_status=old_status,
            to_status=new_status, changed_by=user, note=note
        )
        NotificationService.notify_user(
            project.customer, 'project_status_updated',
            {'project_title': project.title, 'status': new_status}, related_object=project
        )
        return Response(ProjectSerializer(project, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def request_revision(self, request, pk=None):
        project = self.get_object()
        user = request.user
        if project.revision_count >= project.max_revisions:
            return Response({'error': 'Maximum revision limit reached.'}, status=400)
        if not (user == project.customer or user.is_supervisor):
            return Response({'error': 'Only customer or supervisor can request revisions.'}, status=403)

        revision = ProjectRevision.objects.create(
            project=project,
            requested_by=user,
            description=request.data.get('description', ''),
            revision_number=project.revision_count + 1,
        )
        project.revision_count += 1
        project.status = Project.Status.REVISION
        project.save()
        NotificationService.notify_assignment_freelancer(
            project, 'revision_requested',
            {'project_title': project.title, 'revision_number': revision.revision_number}
        )
        return Response(ProjectRevisionSerializer(revision, context={'request': request}).data, status=201)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminOrSupervisor])
    def review_revision(self, request, pk=None):
        project = self.get_object()
        revision_id = request.data.get('revision_id')
        action_type = request.data.get('action')
        notes = request.data.get('notes', '')
        try:
            revision = project.revisions.get(id=revision_id)
        except ProjectRevision.DoesNotExist:
            return Response({'error': 'Revision not found.'}, status=404)
        revision.reviewed_by = request.user
        revision.review_notes = notes
        if action_type == 'approve':
            revision.status = ProjectRevision.Status.APPROVED
            project.status = Project.Status.REVISION
        elif action_type == 'reject':
            revision.status = ProjectRevision.Status.REJECTED
            project.revision_count = max(0, project.revision_count - 1)
            project.status = Project.Status.IN_PROGRESS
        revision.save()
        project.save()
        return Response(ProjectRevisionSerializer(revision, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve_delivery(self, request, pk=None):
        project = self.get_object()
        if project.customer != request.user:
            return Response({'error': 'Only the customer can approve delivery.'}, status=403)
        if project.status not in [Project.Status.REVIEW, Project.Status.IN_PROGRESS]:
            return Response({'error': 'Project is not ready for approval.'}, status=400)
        old_status = project.status
        project.status = Project.Status.COMPLETED
        project.completed_at = timezone.now()
        project.save()
        ProjectStatusHistory.objects.create(
            project=project, from_status=old_status,
            to_status=project.status, changed_by=request.user, note='Customer approved final delivery'
        )
        NotificationService.notify_assignment_freelancer(
            project, 'delivery_approved', {'project_title': project.title}
        )
        return Response({'message': 'Delivery approved. Project completed.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bid(self, request, pk=None):
        project = self.get_object()
        user = request.user
        if not user.is_freelancer:
            return Response({'error': 'Only freelancers can bid.'}, status=403)
        if not project.is_public_to_level:
            return Response({'error': 'This project is not open for bids.'}, status=400)
        bid, created = FreelancerBid.objects.get_or_create(
            project=project, freelancer=user,
            defaults={
                'cover_letter': request.data.get('cover_letter', ''),
                'proposed_budget': request.data.get('proposed_budget'),
                'estimated_days': request.data.get('estimated_days'),
            }
        )
        if not created:
            return Response({'error': 'You have already bid on this project.'}, status=400)
        return Response(FreelancerBidSerializer(bid, context={'request': request}).data, status=201)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsAdminOrSupervisor])
    def bids(self, request, pk=None):
        project = self.get_object()
        bids = project.bids.select_related('freelancer').all()
        return Response(FreelancerBidSerializer(bids, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def accept_assignment(self, request, pk=None):
        project = self.get_object()
        user = request.user
        try:
            assignment = project.assignments.get(
                freelancer=user, status=ProjectAssignment.Status.ASSIGNED
            )
        except ProjectAssignment.DoesNotExist:
            return Response({'error': 'No pending assignment found.'}, status=404)
        assignment.status = ProjectAssignment.Status.ACTIVE
        assignment.accepted_at = timezone.now()
        assignment.save()
        project.status = Project.Status.IN_PROGRESS
        project.save()
        return Response({'message': 'Assignment accepted.'})

    @action(detail=True, methods=['post'])
    def decline_assignment(self, request, pk=None):
        project = self.get_object()
        user = request.user
        try:
            assignment = project.assignments.get(
                freelancer=user, status=ProjectAssignment.Status.ASSIGNED
            )
        except ProjectAssignment.DoesNotExist:
            return Response({'error': 'No pending assignment found.'}, status=404)
        assignment.status = ProjectAssignment.Status.DECLINED
        assignment.declined_at = timezone.now()
        assignment.save()
        project.status = Project.Status.PENDING
        project.save()
        return Response({'message': 'Assignment declined.'})


class ProjectMilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProjectMilestone.objects.filter(project_id=self.kwargs['project_pk'])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_pk'])


class FreelancerDashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_freelancer:
            return Response({'error': 'Freelancer only.'}, status=403)

        assignments = ProjectAssignment.objects.filter(
            freelancer=user
        ).select_related('project').order_by('-created_at')

        active = [a for a in assignments if a.status in [ProjectAssignment.Status.ASSIGNED, ProjectAssignment.Status.ACTIVE]]
        completed = [a for a in assignments if a.status == ProjectAssignment.Status.COMPLETED]

        # Open projects this freelancer can see
        try:
            profile = user.freelancer_profile
            level_code = profile.level.code if profile.level else None
        except Exception:
            level_code = None

        accessible_levels = []
        if level_code:
            level_map = {'A': ['A', 'B', 'C'], 'B': ['B', 'C'], 'C': ['C']}
            accessible_levels = level_map.get(level_code, [])

        open_projects = Project.objects.filter(
            is_public_to_level=True,
            status=Project.Status.PENDING,
            required_level__code__in=accessible_levels
        ).exclude(assignments__freelancer=user).count()

        return Response({
            'active_assignments': len(active),
            'completed_projects': len(completed),
            'open_projects': open_projects,
            'total_assignments': len(assignments),
            'can_accept_projects': getattr(getattr(user, 'freelancer_profile', None), 'can_accept_projects', False),
        })


# ── Standalone ViewSets for ProjectRevision and FreelancerBid ───────────────────

class ProjectRevisionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project revisions independently."""
    serializer_class = ProjectRevisionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'project']
    search_fields = ['description']
    ordering_fields = ['created_at', 'revision_number']

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return ProjectRevision.objects.select_related('project', 'requested_by', 'reviewed_by').all()
        # Customers see revisions for their projects, freelancers see revisions for assigned projects
        return ProjectRevision.objects.filter(
            Q(project__customer=user) | Q(project__assignments__freelancer=user)
        ).distinct().select_related('project', 'requested_by', 'reviewed_by')

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]
        return [permissions.IsAuthenticated()]


class FreelancerBidViewSet(viewsets.ModelViewSet):
    """ViewSet for managing freelancer bids independently."""
    serializer_class = FreelancerBidSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'project']
    ordering_fields = ['created_at', 'proposed_budget']

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return FreelancerBid.objects.select_related('project', 'freelancer').all()
        elif user.is_freelancer:
            # Freelancers see their own bids
            return FreelancerBid.objects.filter(freelancer=user).select_related('project')
        else:
            # Customers see bids on their projects
            return FreelancerBid.objects.filter(project__customer=user).select_related('project', 'freelancer')

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminOrSupervisor()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        # Automatically set freelancer to current user when creating a bid
        serializer.save(freelancer=self.request.user)
