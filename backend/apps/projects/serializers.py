from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ProjectRequest, Project, ProjectAssignment,
    ProjectStatusHistory, ProjectMilestone, ProjectRevision, FreelancerBid
)
from apps.accounts.serializers import FreelancerLevelSerializer

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar    = serializers.SerializerMethodField()
    class Meta:
        model  = User
        fields = ['id', 'full_name', 'email', 'role', 'avatar']
    def get_full_name(self, obj): return obj.get_full_name()
    def get_avatar(self, obj):
        if obj.avatar:
            req = self.context.get('request')
            return req.build_absolute_uri(obj.avatar.url) if req else obj.avatar.url
        return None


class ProjectRequestSerializer(serializers.ModelSerializer):
    customer           = UserMinimalSerializer(read_only=True)
    status_display     = serializers.CharField(source='get_status_display', read_only=True)
    type_display       = serializers.CharField(source='get_project_type_display', read_only=True)
    attachments        = serializers.SerializerMethodField()
    revisions          = serializers.SerializerMethodField()
    revision_count     = serializers.SerializerMethodField()
    current_assignment = serializers.SerializerMethodField()
    status_history     = serializers.SerializerMethodField()
    milestones         = serializers.SerializerMethodField()
    can_revise         = serializers.SerializerMethodField()

    class Meta:
        model  = ProjectRequest
        fields = [
            'id', 'customer', 'project_type', 'type_display', 'title', 'description',
            'requirements', 'budget_min', 'budget_max', 'deadline',
            'preferred_style', 'target_audience', 'special_constraints',
            'sample_references', 'status', 'status_display', 'review_notes',
            'reviewed_by', 'reviewed_at', 'attachments',
            'revisions', 'max_revisions', 'revision_count', 'can_revise',
            'current_assignment', 'status_history', 'milestones',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['customer', 'status', 'review_notes', 'reviewed_by', 'reviewed_at', 'revision_count']

    def get_attachments(self, obj):
        from apps.files.serializers import UploadedFileSerializer
        return UploadedFileSerializer(obj.files.all(), many=True, context=self.context).data

    def _get_project(self, obj):
        return getattr(obj, 'project', None)

    def get_revisions(self, obj):
        project = self._get_project(obj)
        if project:
            return ProjectRevisionSerializer(project.revisions.all(), many=True, context=self.context).data
        return []

    def get_current_assignment(self, obj):
        project = self._get_project(obj)
        if not project:
            return None
        assignment = project.assignments.filter(status__in=[ProjectAssignment.Status.ASSIGNED, ProjectAssignment.Status.ACCEPTED, ProjectAssignment.Status.ACTIVE]).first()
        return ProjectAssignmentSerializer(assignment, context=self.context).data if assignment else None

    def get_status_history(self, obj):
        project = self._get_project(obj)
        if not project:
            return []
        return ProjectStatusHistorySerializer(project.status_history.all(), many=True, context=self.context).data

    def get_milestones(self, obj):
        project = self._get_project(obj)
        if not project:
            return []
        return ProjectMilestoneSerializer(project.milestones.all(), many=True, context=self.context).data

    def get_revision_count(self, obj):
        project = self._get_project(obj)
        if project:
            return project.revision_count
        return 0

    def get_can_revise(self, obj):
        project = self._get_project(obj)
        if project:
            return project.revision_count < project.max_revisions
        # Fallback to request's max_revisions if no linked project
        return getattr(obj, 'revision_count', 0) < getattr(obj, 'max_revisions', 0)

    def update(self, instance, validated_data):
        # If max_revisions is being updated and request is linked to a project, update project too
        if 'max_revisions' in validated_data:
            max_rev = validated_data['max_revisions']
            project = self._get_project(instance)
            if project and max_rev is not None:
                project.max_revisions = max_rev
                project.save()
        # Let super().update() handle updating the request's max_revisions
        instance = super().update(instance, validated_data)
        return instance



class ProjectStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = UserMinimalSerializer(read_only=True)
    class Meta:
        model  = ProjectStatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_by', 'note', 'created_at']


class ProjectMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProjectMilestone
        fields = ['id', 'title', 'description', 'due_date', 'status', 'order', 'completed_at', 'created_at']


class ProjectRevisionSerializer(serializers.ModelSerializer):
    requested_by = UserMinimalSerializer(read_only=True)
    reviewed_by  = UserMinimalSerializer(read_only=True)
    class Meta:
        model  = ProjectRevision
        fields = ['id', 'requested_by', 'reviewed_by', 'description', 'status', 'review_notes', 'revision_number', 'created_at', 'updated_at']
        read_only_fields = ['requested_by', 'revision_number', 'reviewed_by']


class ProjectAssignmentSerializer(serializers.ModelSerializer):
    freelancer  = UserMinimalSerializer(read_only=True)
    assigned_by = UserMinimalSerializer(read_only=True)
    class Meta:
        model  = ProjectAssignment
        fields = ['id', 'freelancer', 'assigned_by', 'status', 'notes', 'accepted_at', 'declined_at', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    customer           = UserMinimalSerializer(read_only=True)
    required_level     = FreelancerLevelSerializer(read_only=True)
    status_display     = serializers.CharField(source='get_status_display', read_only=True)
    type_display       = serializers.CharField(source='get_project_type_display', read_only=True)
    current_assignment = serializers.SerializerMethodField()
    status_history     = ProjectStatusHistorySerializer(many=True, read_only=True)
    milestones         = ProjectMilestoneSerializer(many=True, read_only=True)
    revisions          = ProjectRevisionSerializer(many=True, read_only=True)
    files              = serializers.SerializerMethodField()
    can_revise         = serializers.SerializerMethodField()
    review             = serializers.SerializerMethodField()
    class Meta:
        model  = Project
        fields = [
            'id', 'title', 'description', 'project_type', 'type_display',
            'customer', 'required_level', 'status', 'status_display',
            'assignment_mode', 'budget', 'deadline', 'priority',
            'requirements', 'budget_min', 'budget_max', 'preferred_style', 'target_audience', 'special_constraints', 'sample_references',
            'max_revisions', 'revision_count', 'can_revise',
            'is_public_to_level', 'internal_notes',
            'current_assignment', 'status_history', 'milestones', 'revisions',
            'files', 'review', 'created_at', 'updated_at', 'completed_at',
        ]
        read_only_fields = ['customer', 'revision_count']
    def get_current_assignment(self, obj):
        a = obj.assignments.filter(status__in=[ProjectAssignment.Status.ASSIGNED, ProjectAssignment.Status.ACCEPTED, ProjectAssignment.Status.ACTIVE]).first()
        return ProjectAssignmentSerializer(a, context=self.context).data if a else None
    def get_files(self, obj):
        from apps.files.serializers import UploadedFileSerializer
        return UploadedFileSerializer(obj.files.all(), many=True, context=self.context).data
    def get_can_revise(self, obj): return obj.revision_count < obj.max_revisions
    def get_review(self, obj):
        try:
            r = obj.review
            return {'id': str(r.id), 'rating': r.rating, 'status': r.status}
        except Exception:
            return None


class ProjectCreateSerializer(serializers.ModelSerializer):
    customer_id       = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    required_level_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    class Meta:
        model  = Project
        fields = [
            'title', 'description', 'project_type',
            'requirements', 'preferred_style', 'target_audience', 'special_constraints', 'sample_references',
            'customer_id', 'required_level_id',
            'assignment_mode', 'budget', 'deadline', 'priority',
            'budget_min', 'budget_max',
            'max_revisions', 'is_public_to_level', 'internal_notes',
        ]
    def create(self, validated_data):
        from apps.accounts.models import FreelancerLevel
        customer_id       = validated_data.pop('customer_id', None)
        required_level_id = validated_data.pop('required_level_id', None)
        # Preserve budget_min/budget_max on project creation if provided
        budget_min = validated_data.pop('budget_min', None)
        budget_max = validated_data.pop('budget_max', None)
        if customer_id:
            try:
                validated_data['customer'] = User.objects.get(id=customer_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({'customer_id': 'Customer not found.'})
        else:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                validated_data['customer'] = request.user
            else:
                raise serializers.ValidationError({'customer_id': 'A customer is required.'})
        if required_level_id:
            try:
                validated_data['required_level'] = FreelancerLevel.objects.get(id=required_level_id)
            except FreelancerLevel.DoesNotExist:
                pass
        if budget_min is not None:
            validated_data['budget_min'] = budget_min
        if budget_max is not None:
            validated_data['budget_max'] = budget_max
        return super().create(validated_data)


class FreelancerBidSerializer(serializers.ModelSerializer):
    freelancer = UserMinimalSerializer(read_only=True)
    class Meta:
        model  = FreelancerBid
        fields = ['id', 'freelancer', 'cover_letter', 'proposed_budget', 'estimated_days', 'status', 'created_at']
        read_only_fields = ['freelancer', 'status']
