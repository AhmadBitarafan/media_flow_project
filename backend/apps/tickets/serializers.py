from rest_framework import serializers
from .models import Ticket, TicketMessage
from apps.accounts.serializers import UserSerializer


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class Meta:
        from django.contrib.auth import get_user_model
        model = get_user_model()
        fields = ['id', 'full_name', 'email', 'role']
    def get_full_name(self, obj): return obj.get_full_name()


class TicketMessageSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)
    files = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ['id', 'author', 'content', 'is_internal', 'files', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at']

    def get_files(self, obj):
        from apps.files.serializers import UploadedFileSerializer
        # Files attached to this ticket message (linked via ticket)
        return []


class TicketSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)
    files = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'created_by', 'assigned_to', 'subject', 'description',
            'status', 'status_display', 'priority', 'priority_display', 'category',
            'project', 'messages', 'files', 'message_count', 'created_at', 'updated_at', 'resolved_at',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_files(self, obj):
        from apps.files.serializers import UploadedFileSerializer
        return UploadedFileSerializer(obj.files.all(), many=True, context=self.context).data

    def get_message_count(self, obj):
        return obj.messages.count()
