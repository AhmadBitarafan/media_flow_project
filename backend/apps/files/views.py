from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from django.conf import settings
import mimetypes
import os

from .models import UploadedFile, DANGEROUS_EXTENSIONS, DANGEROUS_CONTENT_TYPES
from .serializers import UploadedFileSerializer, FileUploadSerializer


class FileUploadView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        file = data['file']

        # Validate file size
        if file.size > settings.MAX_UPLOAD_SIZE:
            max_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
            return Response({'error': f'File too large. Maximum size is {max_mb}MB.'}, status=400)

        # Validate file extension
        filename = file.name
        file_ext = os.path.splitext(filename)[1].lower()
        
        if file_ext in DANGEROUS_EXTENSIONS:
            return Response(
                {'error': f'File type {file_ext} is not allowed for security reasons.'},
                status=400
            )

        # Determine and validate content type
        content_type = file.content_type or mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        if content_type in DANGEROUS_CONTENT_TYPES:
            return Response(
                {'error': f'File type is not allowed for security reasons.'},
                status=400
            )

        if content_type not in settings.ALLOWED_FILE_TYPES:
            return Response({'error': f'File type {content_type} not allowed.'}, status=400)

        uploaded = UploadedFile(
            uploaded_by=request.user,
            file=file,
            original_name=file.name,
            category=data.get('category', UploadedFile.Category.GENERAL),
            content_type=content_type,
            size=file.size,
        )

        # Link to related objects
        if data.get('project'):
            from apps.projects.models import Project
            try:
                uploaded.project = Project.objects.get(id=data['project'])
            except Project.DoesNotExist:
                pass

        if data.get('project_request'):
            from apps.projects.models import ProjectRequest
            try:
                uploaded.project_request = ProjectRequest.objects.get(id=data['project_request'])
            except ProjectRequest.DoesNotExist:
                pass

        if data.get('ticket'):
            from apps.tickets.models import Ticket
            try:
                uploaded.ticket = Ticket.objects.get(id=data['ticket'])
            except Exception:
                pass

        if data.get('revision'):
            from apps.projects.models import ProjectRevision
            try:
                uploaded.revision = ProjectRevision.objects.get(id=data['revision'])
            except ProjectRevision.DoesNotExist:
                pass

        uploaded.save()
        return Response(UploadedFileSerializer(uploaded, context={'request': request}).data, status=201)


class FileListView(generics.ListAPIView):
    serializer_class = UploadedFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = UploadedFile.objects.all()
        if not user.is_supervisor:
            qs = qs.filter(uploaded_by=user)
        project_id = self.request.query_params.get('project')
        ticket_id = self.request.query_params.get('ticket')
        if project_id:
            qs = qs.filter(project_id=project_id)
        if ticket_id:
            qs = qs.filter(ticket_id=ticket_id)
        return qs


class FileDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return UploadedFile.objects.all()
        return UploadedFile.objects.filter(uploaded_by=user)
