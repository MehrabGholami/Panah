from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.application.services.seed_service import SeedService
from accounts.infrastructure.repositories.user_repository import UserRepository
from accounts.models import Role
from disasters.application.services.disaster_service import DisasterService
from missions.application.services.mission_service import MissionService
from skills.models import Skill


class Command(BaseCommand):
    help = "Seed demo disaster scenario for testing and demos."

    def handle(self, *args, **options):
        SeedService().seed_all(
            admin_email="InvesticaCO@gmail.com",
            admin_password="Investica003",
        )

        first_aid, _ = Skill.objects.get_or_create(
            name="کمک‌های اولیه",
            defaults={"category": "پزشکی", "description": "ارائه کمک‌های اولیه در محل حادثه"},
        )
        logistics, _ = Skill.objects.get_or_create(
            name="توزیع اقلام",
            defaults={"category": "لجستیک", "description": "توزیع بسته‌های امدادی"},
        )

        disaster = DisasterService().create(
            title="زلزله نمونه — منطقه آزمایشی",
            description="سناریوی آزمایشی برای ارزیابی پلتفرم پناه",
            severity="high",
            location="تهران — منطقه ۵",
            metadata={"demo": True, "magnitude": 5.2},
        )

        admin = UserRepository().get_by_email("InvesticaCO@gmail.com")
        coordinator_role = Role.objects.get(slug="coordinator")
        UserRepository().assign_role(admin, coordinator_role)

        mission = MissionService().create(
            coordinator=admin,
            disaster_id=disaster.pk,
            title="توزیع بسته‌های امدادی",
            description="هماهنگی داوطلبان برای توزیع بسته‌های غذایی و بهداشتی",
            required_volunteers=10,
            start_time=timezone.now(),
            end_time=timezone.now() + timezone.timedelta(days=3),
        )
        MissionService().publish(mission.pk)

        self.stdout.write(self.style.SUCCESS(f"Demo disaster: {disaster.title}"))
        self.stdout.write(self.style.SUCCESS(f"Demo mission: {mission.title}"))
        self.stdout.write(self.style.SUCCESS(f"Skills: {first_aid.name}, {logistics.name}"))
