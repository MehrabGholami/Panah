from django.core.management.base import BaseCommand
import os

from accounts.application.services.seed_service import SeedService


class Command(BaseCommand):
    help = "Seed roles, permissions, and admin user."

    def add_arguments(self, parser):
        parser.add_argument(
            "--admin-email",
            default=os.environ.get("ADMIN_EMAIL", "InvesticaCO@gmail.com"),
            help="Admin user email address.",
        )
        parser.add_argument(
            "--admin-password",
            default=os.environ.get("ADMIN_PASSWORD", "Investica003"),
            help="Admin user password.",
        )

    def handle(self, *args, **options):
        result = SeedService().seed_all(
            admin_email=options["admin_email"],
            admin_password=options["admin_password"],
        )
        self.stdout.write(self.style.SUCCESS(f"Seeded {result['permissions']} permissions"))
        self.stdout.write(self.style.SUCCESS(f"Seeded {result['roles']} roles"))
        self.stdout.write(self.style.SUCCESS(f"Admin user: {result['admin_email']}"))