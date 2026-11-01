import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Review(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Moderation'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField('projects.Project', on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    quality_score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], default=3
    )
    communication_score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], default=3
    )
    timeliness_score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], default=3
    )
    comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    moderated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='moderated_reviews')
    moderation_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']

    def __str__(self):
        return f'Review by {self.reviewer.email} for {self.freelancer.email} - {self.rating}/5'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.status == self.Status.APPROVED:
            self._update_freelancer_rating()

    def _update_freelancer_rating(self):
        from django.db.models import Avg
        avg = Review.objects.filter(
            freelancer=self.freelancer, status=self.Status.APPROVED
        ).aggregate(avg=Avg('rating'))['avg'] or 0
        try:
            profile = self.freelancer.freelancer_profile
            profile.average_rating = round(avg, 2)
            profile.save(update_fields=['average_rating'])
        except Exception:
            pass
