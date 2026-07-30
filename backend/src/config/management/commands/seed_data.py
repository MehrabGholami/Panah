from django.core.management.base import BaseCommand

from accounts.application.services.seed_service import SeedService
from common.utils.env_credentials import get_admin_email, get_admin_password


class Command(BaseCommand):
    help = "Seed roles, permissions, and admin user."

    def add_arguments(self, parser):
        parser.add_argument(
            "--admin-email",
            default=None,
            help="Admin user email address (defaults to ADMIN_EMAIL from the environment).",
        )
        parser.add_argument(
            "--admin-password",
            default=None,
            help="Admin user password (defaults to ADMIN_PASSWORD from the environment).",
        )

    def handle(self, *args, **options):
        admin_email = options["admin_email"] or get_admin_email()
        admin_password = options["admin_password"] or get_admin_password()
        result = SeedService().seed_all(
            admin_email=admin_email,
            admin_password=admin_password,
        )
        self.stdout.write(self.style.SUCCESS(f"Seeded {result['permissions']} permissions"))
        self.stdout.write(self.style.SUCCESS(f"Seeded {result['roles']} roles"))
        self.stdout.write(self.style.SUCCESS(f"Admin user: {result['admin_email']}"))
