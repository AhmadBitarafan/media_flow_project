from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import FreelancerLevel, FreelancerProfile, CustomerProfile
from apps.wallets.models import Wallet

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed initial data: freelancer levels, admin user, sample users'

    def handle(self, *args, **options):
        self.stdout.write('Seeding freelancer levels...')
        levels = [
            {'code': 'A', 'name': 'Expert', 'rank': 1, 'description': 'Top-tier verified experts', 'min_rating': 4.5},
            {'code': 'B', 'name': 'Professional', 'rank': 2, 'description': 'Experienced professionals', 'min_rating': 3.5},
            {'code': 'C', 'name': 'Standard', 'rank': 3, 'description': 'Entry-level freelancers', 'min_rating': 0},
        ]
        for data in levels:
            level, created = FreelancerLevel.objects.get_or_create(code=data['code'], defaults=data)
            self.stdout.write(f'  {"Created" if created else "Exists"}: Level {level.code} - {level.name}')

        self.stdout.write('Creating admin user...')
        admin, created = User.objects.get_or_create(
            email='admin@mediaflow.io',
            defaults={
                'first_name': 'System',
                'last_name': 'Admin',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin.set_password('admin123!')
            admin.save()
            self.stdout.write('  Created admin: admin@mediaflow.io / admin123!')
        else:
            self.stdout.write('  Admin already exists.')

        self.stdout.write('Creating supervisor...')
        sup, created = User.objects.get_or_create(
            email='supervisor@mediaflow.io',
            defaults={
                'first_name': 'Jane',
                'last_name': 'Supervisor',
                'role': User.Role.SUPERVISOR,
                'is_staff': True,
                'is_active': True,
            }
        )
        if created:
            sup.set_password('super123!')
            sup.save()
            self.stdout.write('  Created supervisor: supervisor@mediaflow.io / super123!')

        self.stdout.write('Creating sample customer...')
        customer, created = User.objects.get_or_create(
            email='customer@example.com',
            defaults={
                'first_name': 'Alice',
                'last_name': 'Customer',
                'role': User.Role.CUSTOMER,
                'is_active': True,
            }
        )
        if created:
            customer.set_password('customer123!')
            customer.save()
            CustomerProfile.objects.get_or_create(user=customer, defaults={'company_name': 'Acme Corp'})
            Wallet.objects.get_or_create(user=customer)
            self.stdout.write('  Created customer: customer@example.com / customer123!')

        self.stdout.write('Creating sample freelancer...')
        fl, created = User.objects.get_or_create(
            email='freelancer@example.com',
            defaults={
                'first_name': 'Bob',
                'last_name': 'Freelancer',
                'role': User.Role.FREELANCER,
                'is_active': True,
            }
        )
        if created:
            fl.set_password('freelancer123!')
            fl.save()
            level_b = FreelancerLevel.objects.get(code='B')
            profile, _ = FreelancerProfile.objects.get_or_create(
                user=fl,
                defaults={
                    'level': level_b,
                    'bio': 'Experienced video producer with 5 years in the industry.',
                    'skills': ['Video Editing', 'Motion Graphics', 'Color Grading'],
                    'years_experience': 5,
                    'verification_status': FreelancerProfile.Status.APPROVED,
                    'can_accept_projects': True,
                }
            )
            Wallet.objects.get_or_create(user=fl)
            self.stdout.write('  Created freelancer: freelancer@example.com / freelancer123!')

        self.stdout.write(self.style.SUCCESS('\nSeed complete!'))
        self.stdout.write('\nDemo credentials:')
        self.stdout.write('  Admin:      admin@mediaflow.io       / admin123!')
        self.stdout.write('  Supervisor: supervisor@mediaflow.io  / super123!')
        self.stdout.write('  Customer:   customer@example.com     / customer123!')
        self.stdout.write('  Freelancer: freelancer@example.com   / freelancer123!')
