from rest_framework import serializers, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    freelancer_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'project', 'reviewer_name', 'freelancer_name',
            'rating', 'quality_score', 'communication_score', 'timeliness_score',
            'comment', 'status', 'status_display', 'moderation_note', 'created_at',
        ]
        read_only_fields = ['status', 'moderation_note', 'created_at']

    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name()

    def get_freelancer_name(self, obj):
        return obj.freelancer.get_full_name()

    def validate_project(self, project):
        request = self.context['request']
        user = request.user
        if project.customer != user:
            raise serializers.ValidationError('You can only review projects you commissioned.')
        if project.status != 'completed':
            raise serializers.ValidationError('Project must be completed before reviewing.')
        if hasattr(project, 'review'):
            raise serializers.ValidationError('This project has already been reviewed.')
        return project

    def create(self, validated_data):
        request = self.context['request']
        project = validated_data['project']
        assignment = project.assignments.filter(status__in=['active', 'completed']).first()
        if not assignment:
            raise serializers.ValidationError('No freelancer found for this project.')
        validated_data['reviewer'] = request.user
        validated_data['freelancer'] = assignment.freelancer
        return super().create(validated_data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_supervisor:
            return Review.objects.select_related('reviewer', 'freelancer', 'project').all()
        if user.is_freelancer:
            return Review.objects.filter(freelancer=user, status=Review.Status.APPROVED)
        return Review.objects.filter(reviewer=user)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def moderate(self, request, pk=None):
        if not request.user.is_supervisor:
            return Response({'error': 'Not authorized.'}, status=403)
        review = self.get_object()
        action_type = request.data.get('action', 'approve')
        note = request.data.get('note', '')
        review.moderated_by = request.user
        review.moderation_note = note
        if action_type == 'approve':
            review.status = Review.Status.APPROVED
        else:
            review.status = Review.Status.REJECTED
        review.save()
        return Response(ReviewSerializer(review, context={'request': request}).data)


router = DefaultRouter()
router.register('', ReviewViewSet, basename='reviews')
urlpatterns = [path('', include(router.urls))]
