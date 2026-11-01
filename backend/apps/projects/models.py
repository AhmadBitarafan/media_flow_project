import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.accounts.models import FreelancerLevel

User = get_user_model()


class ProjectRequest(models.Model):
    class ProjectType(models.TextChoices):
        VIDEO_PRODUCTION = 'video_production', 'Video Production'
        PHOTOGRAPHY = 'photography', 'Photography'
        GRAPHIC_DESIGN = 'graphic_design', 'Graphic Design'
        ANIMATION = 'animation', 'Animation'
        AUDIO_PRODUCTION = 'audio_production', 'Audio Production'
        SOCIAL_MEDIA = 'social_media', 'Social Media Content'
        BRANDING = 'branding', 'Branding & Identity'
        WEB_CONTENT = 'web_content', 'Web Content'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        UNDER_REVIEW = 'under_review', 'Under Review'
        APPROVED = 'approved', 'Approved & Converting'
        REJECTED = 'rejected', 'Rejected'
        CONVERTED = 'converted', 'Converted to Project'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_requests')
    project_type = models.CharField(max_length=30, choices=ProjectType.choices)
    title = models.CharField(max_length=300)
    description = models.TextField()
    requirements = models.TextField()
    budget_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    preferred_style = models.TextField(blank=True)
    target_audience = models.TextField(blank=True)
    special_constraints = models.TextField(blank=True)
    sample_references = models.TextField(blank=True, help_text='URLs or descriptions of reference works')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    review_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='reviewed_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    max_revisions = models.PositiveIntegerField(default=3, help_text='Maximum revisions allowed when converted to project')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'Request: {self.title} [{self.status}]'


class Project(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Assignment'
        ASSIGNED = 'assigned', 'Assigned'
        IN_PROGRESS = 'in_progress', 'In Progress'
        REVIEW = 'review', 'Under Review'
        REVISION = 'revision', 'Revision Requested'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        ON_HOLD = 'on_hold', 'On Hold'

    class AssignmentMode(models.TextChoices):
        MANUAL = 'manual', 'Manually Assigned'
        OPEN = 'open', 'Open for Bids'
        AUTO = 'auto', 'Auto Assigned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(ProjectRequest, on_delete=models.CASCADE, related_name='project', null=True, blank=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects_as_customer')
    title = models.CharField(max_length=300)
    description = models.TextField()
    # Additional editable fields mirrored from ProjectRequest
    requirements = models.TextField(blank=True)
    budget_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    preferred_style = models.TextField(blank=True)
    target_audience = models.TextField(blank=True)
    special_constraints = models.TextField(blank=True)
    sample_references = models.TextField(blank=True, help_text='URLs or descriptions of reference works')
    project_type = models.CharField(max_length=30, choices=ProjectRequest.ProjectType.choices)
    required_level = models.ForeignKey(FreelancerLevel, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    assignment_mode = models.CharField(max_length=10, choices=AssignmentMode.choices, default=AssignmentMode.MANUAL)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    priority = models.PositiveIntegerField(default=3)  # 1=highest
    internal_notes = models.TextField(blank=True)
    max_revisions = models.PositiveIntegerField(default=3)
    revision_count = models.PositiveIntegerField(default=0)
    is_public_to_level = models.BooleanField(default=False, help_text='Visible to matching level freelancers')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return f'Project: {self.title} [{self.status}]'


class ProjectAssignment(models.Model):
    class Status(models.TextChoices):
        ASSIGNED = 'assigned', 'Assigned'
        ACCEPTED = 'accepted', 'Accepted'
        DECLINED = 'declined', 'Declined'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        REMOVED = 'removed', 'Removed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='assignments')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_assignments')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='assignments_made')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ASSIGNED)
    notes = models.TextField(blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    declined_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_assignments'
        unique_together = ['project', 'freelancer']

    def __str__(self):
        return f'Assignment: {self.project.title} → {self.freelancer.get_full_name()}'


class ProjectStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_status_history'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.project.title}: {self.from_status} → {self.to_status}'


class ProjectMilestone(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        SKIPPED = 'skipped', 'Skipped'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    order = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_milestones'
        ordering = ['order']


class ProjectRevision(models.Model):
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='revisions')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='revision_requests')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='reviewed_revisions')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    review_notes = models.TextField(blank=True)
    revision_number = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_revisions'
        ordering = ['-created_at']

    def __str__(self):
        return f'Revision #{self.revision_number} for {self.project.title}'


class FreelancerBid(models.Model):
    """Freelancer declares readiness / bids for open projects."""
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='bids')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    cover_letter = models.TextField(blank=True)
    proposed_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estimated_days = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'freelancer_bids'
        unique_together = ['project', 'freelancer']
