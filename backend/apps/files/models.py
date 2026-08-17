import uuid
import os
import mimetypes
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.conf import settings

User = get_user_model()

# Dangerous file extensions that could execute code or be destructive
DANGEROUS_EXTENSIONS = {
    # Executables
    '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar', '.app', '.msi',
    # Shell scripts
    '.sh', '.bash', '.zsh', '.ksh', '.csh', '.ps1', '.psm1', '.psc1',
    # Archives with unknown content
    '.iso', '.dmg',
    # Code files (when uploaded to support tickets, these could be risky)
    '.py', '.rb', '.php', '.jsp', '.asp', '.aspx', '.go', '.rs', '.cpp', '.c',
}

DANGEROUS_CONTENT_TYPES = {
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-executable',
    'application/x-elf',
    'application/x-sh',
    'application/x-shellscript',
    'application/x-perl',
    'application/x-python',
}


def upload_to(instance, filename):
    ext = filename.rsplit('.', 1)[-1].lower()
    new_name = f'{uuid.uuid4().hex}.{ext}'
    category = instance.category or 'general'
    return f'uploads/{category}/{new_name}'


def validate_file(file):
    # Check file size
    if file.size > settings.MAX_UPLOAD_SIZE:
        max_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
        raise ValidationError(f'File size exceeds maximum allowed ({max_mb}MB).')
    
    # Check file extension
    filename = getattr(file, 'name', '')
    file_ext = os.path.splitext(filename)[1].lower()
    
    if file_ext in DANGEROUS_EXTENSIONS:
        raise ValidationError(f'File type {file_ext} is not allowed for security reasons.')
    
    # Check content type
    content_type = getattr(file, 'content_type', None) or mimetypes.guess_type(filename)[0] or 'application/octet-stream'
    
    if content_type in DANGEROUS_CONTENT_TYPES:
        raise ValidationError(f'File type {content_type} is not allowed for security reasons.')
    
    if content_type not in settings.ALLOWED_FILE_TYPES:
        raise ValidationError(f'File type {content_type} is not allowed.')


class UploadedFile(models.Model):
    class Category(models.TextChoices):
        PROJECT_ATTACHMENT = 'project_attachment', 'Project Attachment'
        PROJECT_REQUEST = 'project_request', 'Project Request'
        DELIVERABLE = 'deliverable', 'Deliverable'
        REVISION = 'revision', 'Revision'
        TICKET = 'ticket', 'Ticket'
        FREELANCER_DOC = 'freelancer_doc', 'Freelancer Document'
        SAMPLE_REFERENCE = 'sample_reference', 'Sample Reference'
        FINAL_OUTPUT = 'final_output', 'Final Output'
        AVATAR = 'avatar', 'Avatar'
        GENERAL = 'general', 'General'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    file = models.FileField(upload_to=upload_to, validators=[validate_file])
    original_name = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.GENERAL)
    content_type = models.CharField(max_length=100)
    size = models.PositiveBigIntegerField(default=0)
    is_public = models.BooleanField(default=False)

    # Generic relations to other models
    project = models.ForeignKey(
        'projects.Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='files'
    )
    project_request = models.ForeignKey(
        'projects.ProjectRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='files'
    )
    ticket = models.ForeignKey(
        'tickets.Ticket', on_delete=models.SET_NULL, null=True, blank=True, related_name='files'
    )
    revision = models.ForeignKey(
        'projects.ProjectRevision', on_delete=models.SET_NULL, null=True, blank=True, related_name='files'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'uploaded_files'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.original_name} ({self.category})'

    @property
    def size_display(self):
        size = self.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'

    def get_file_extension(self):
        return os.path.splitext(self.original_name)[1].lower()
