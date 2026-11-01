# serializers.py
from rest_framework import serializers
from .models import UploadedFile


class UploadedFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = UploadedFile
        fields = [
            'id', 'original_name', 'category', 'content_type', 'size',
            'size_display', 'url', 'uploaded_by_name', 'is_public', 'created_at',
        ]
        read_only_fields = ['id', 'original_name', 'content_type', 'size', 'created_at']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name()


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    category = serializers.ChoiceField(choices=UploadedFile.Category.choices, default=UploadedFile.Category.GENERAL)
    project = serializers.UUIDField(required=False, allow_null=True)
    project_request = serializers.UUIDField(required=False, allow_null=True)
    ticket = serializers.UUIDField(required=False, allow_null=True)
    revision = serializers.UUIDField(required=False, allow_null=True)
