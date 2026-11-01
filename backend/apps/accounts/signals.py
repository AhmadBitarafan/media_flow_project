from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import FreelancerProfile, CustomerProfile
from apps.wallets.models import Wallet

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile_and_wallet(sender, instance, created, **kwargs):
    if created:
        if instance.role == User.Role.FREELANCER:
            FreelancerProfile.objects.get_or_create(user=instance)
        elif instance.role == User.Role.CUSTOMER:
            CustomerProfile.objects.get_or_create(user=instance)
        # Create wallet for freelancers and customers
        if instance.role in [User.Role.FREELANCER, User.Role.CUSTOMER]:
            Wallet.objects.get_or_create(user=instance)
