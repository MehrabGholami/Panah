from django.core.management.base import BaseCommand

from common.utils.env_credentials import get_admin_email, get_admin_password, get_seed_password
from config.application.services.bulk_seed_service import BulkSeedService
from config.data.persian_seed_data import SEED_EMAIL_DOMAIN


class Command(BaseCommand):
    help = "Seed MVP-scale demo data (volunteers, disasters, missions) for load testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--volunteers",
            type=int,
            default=800,
            help="Number of volunteer accounts to create (default: 800).",
        )
        parser.add_argument(
            "--disasters",
            type=int,
            default=25,
            help="Number of disasters to create (default: 25).",
        )
        parser.add_argument(
            "--missions",
            type=int,
            default=100,
            help="Number of missions to create (default: 100).",
        )
        parser.add_argument(
            "--password",
            default=None,
            help="Password for seeded volunteer/coordinator accounts (defaults to SEED_PASSWORD).",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="Random seed for reproducible data generation.",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove previous bulk seed data before creating new records.",
        )
        parser.add_argument(
            "--admin-email",
            default=None,
            help="Admin email (defaults to ADMIN_EMAIL).",
        )
        parser.add_argument(
            "--admin-password",
            default=None,
            help="Admin password (defaults to ADMIN_PASSWORD).",
        )

    def handle(self, *args, **options):
        password = options["password"] or get_seed_password()
        admin_email = options["admin_email"] or get_admin_email()
        admin_password = options["admin_password"] or get_admin_password()
        service = BulkSeedService(seed=options["seed"])
        result = service.run(
            volunteers=options["volunteers"],
            disasters=options["disasters"],
            missions=options["missions"],
            password=password,
            clear=options["clear"],
            admin_email=admin_email,
            admin_password=admin_password,
        )

        self.stdout.write(self.style.SUCCESS(f"Batch ID: {result.batch_id}"))
        self.stdout.write(self.style.SUCCESS(f"Coordinators: {result.coordinators}"))
        self.stdout.write(self.style.SUCCESS(f"Volunteers: {result.volunteers}"))
        self.stdout.write(self.style.SUCCESS(f"User profiles: {result.profiles}"))
        self.stdout.write(self.style.SUCCESS(f"Volunteer skills: {result.volunteer_skills}"))
        self.stdout.write(self.style.SUCCESS(f"Disasters: {result.disasters}"))
        self.stdout.write(self.style.SUCCESS(f"Missions: {result.missions}"))
        self.stdout.write(self.style.SUCCESS(f"Applications: {result.applications}"))
        self.stdout.write(self.style.SUCCESS(f"Assignments: {result.assignments}"))
        self.stdout.write("")
        self.stdout.write(f"Sample volunteer: volunteer1{SEED_EMAIL_DOMAIN}")
        self.stdout.write(f"Sample coordinator: coordinator1{SEED_EMAIL_DOMAIN}")
        self.stdout.write(f"Password: {password}")
