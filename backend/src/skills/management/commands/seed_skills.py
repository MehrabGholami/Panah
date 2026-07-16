from django.core.management.base import BaseCommand

from skills.application.services.skill_seed_service import seed_default_skills


class Command(BaseCommand):
    help = "Seed standard mission/volunteer skills."

    def handle(self, *args, **options):
        created = seed_default_skills()
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new skills."))
