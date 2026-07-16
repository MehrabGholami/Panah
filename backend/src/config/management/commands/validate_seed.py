"""Validate bulk seed data integrity for counts and display correctness."""

from collections import Counter

from django.core.management.base import BaseCommand
from django.db.models import Count

from accounts.models import User
from assignments.models import Assignment
from config.data.persian_seed_data import PROVINCES_CITIES, SEED_EMAIL_DOMAIN
from disasters.domain.enums import DisasterStatus
from disasters.models import Disaster
from missions.domain.enums import MissionApplicationStatus, MissionStatus
from missions.models import Mission, MissionApplication
from skills.models import Skill, VolunteerSkill
from volunteers.domain.enums import VolunteerStatus
from volunteers.models import VolunteerProfile

VALID_NEEDS = {
    "rescue",
    "medical",
    "shelter",
    "food",
    "water",
    "equipment",
    "transport",
    "clothing",
    "volunteers",
    "psychosocial",
    "other",
}


class Command(BaseCommand):
    help = "Validate seed data counts and content quality"

    def handle(self, *args, **options):
        issues: list[str] = []
        warnings: list[str] = []

        seed_volunteers = User.objects.filter(
            email__endswith=SEED_EMAIL_DOMAIN,
            email__startswith="volunteer",
        )
        seed_profiles = VolunteerProfile.objects.filter(user__in=seed_volunteers)
        seed_disasters = Disaster.objects.filter(metadata__seed=True)
        seed_missions = Mission.objects.filter(metadata__seed=True)

        self.stdout.write("=== COUNTS ===")
        self.stdout.write(f"Seed volunteers: {seed_volunteers.count()}")
        self.stdout.write(f"Seed disasters: {seed_disasters.count()}")
        self.stdout.write(f"Seed missions: {seed_missions.count()}")
        self.stdout.write(f"Non-seed disasters: {Disaster.objects.exclude(metadata__seed=True).count()}")
        self.stdout.write(f"Non-seed missions: {Mission.objects.exclude(metadata__seed=True).count()}")
        self.stdout.write(
            f"Volunteer skills: {VolunteerSkill.objects.filter(volunteer__user__in=seed_volunteers).count()}"
        )
        self.stdout.write(
            f"Applications: {MissionApplication.objects.filter(mission__in=seed_missions).count()}"
        )
        self.stdout.write(
            f"Assignments: {Assignment.objects.filter(mission__in=seed_missions).count()}"
        )

        self.stdout.write("\n=== VOLUNTEER STATUS ===")
        for row in seed_profiles.values("status").annotate(c=Count("id")).order_by("-c"):
            self.stdout.write(f"  {row['status']}: {row['c']}")

        self.stdout.write("\n=== DISASTER STATUS ===")
        for row in seed_disasters.values("status").annotate(c=Count("id")).order_by("-c"):
            self.stdout.write(f"  {row['status']}: {row['c']}")

        self.stdout.write("\n=== VOLUNTEER COUNTS ===")
        self.stdout.write(f"  active: {seed_profiles.filter(status=VolunteerStatus.ACTIVE.value).count()}")
        self.stdout.write(f"  rejected: {seed_profiles.filter(status=VolunteerStatus.REJECTED.value).count()}")
        pending = seed_profiles.filter(status=VolunteerStatus.PENDING_APPROVAL.value).count()
        if pending:
            issues.append(
                f"{pending} volunteers still have status=pending_approval (registration approval removed)"
            )
        hidden_registered = seed_profiles.filter(status=VolunteerStatus.REGISTERED.value).count()
        if hidden_registered:
            issues.append(
                f"{hidden_registered} volunteers have status=registered (unused status)"
            )

        self.stdout.write("\n=== MISSION STATUS (seed) ===")
        for row in seed_missions.values("status").annotate(c=Count("id")).order_by("-c"):
            self.stdout.write(f"  {row['status']}: {row['c']}")

        # --- Validation rules ---
        if seed_volunteers.count() == 0:
            issues.append("No seed volunteers found. Run seed_bulk first.")

        inactive_approved = seed_volunteers.filter(
            is_approved=True,
            volunteer_profile__status__in=[
                VolunteerStatus.PENDING_APPROVAL.value,
                VolunteerStatus.REGISTERED.value,
                VolunteerStatus.REJECTED.value,
            ],
        ).count()
        if inactive_approved:
            issues.append(f"{inactive_approved} volunteers have is_approved=True but non-active status")

        active_not_approved = seed_volunteers.filter(
            is_approved=False,
            volunteer_profile__status=VolunteerStatus.ACTIVE.value,
        ).count()
        if active_not_approved:
            issues.append(f"{active_not_approved} active volunteers have is_approved=False")

        no_skills = seed_profiles.annotate(sc=Count("volunteer_skills")).filter(sc=0).count()
        if no_skills:
            issues.append(f"{no_skills} seed volunteers have no skills")

        skill_names = set(Skill.objects.values_list("name", flat=True))
        for vs in VolunteerSkill.objects.filter(volunteer__user__in=seed_volunteers).select_related("skill")[:5]:
            if vs.skill.name not in skill_names:
                issues.append(f"Invalid skill reference: {vs.skill.name}")
                break

        # City/province consistency
        bad_cities = 0
        for vp in seed_profiles.exclude(city="").iterator():
            city = vp.city
            if not any(city in cities for cities in PROVINCES_CITIES.values()):
                bad_cities += 1
        if bad_cities:
            warnings.append(f"{bad_cities} volunteer cities not in PROVINCES_CITIES")

        # Location detail must not repeat province/city (stored separately)
        bad_locations = 0
        for record in seed_disasters.iterator():
            first_segment = (record.location or "").split(" — ")[0].strip()
            if first_segment in {record.province, record.city}:
                bad_locations += 1
        for record in seed_missions.iterator():
            first_segment = (record.location or "").split(" — ")[0].strip()
            if first_segment in {record.province, record.city}:
                bad_locations += 1
        if bad_locations:
            issues.append(f"{bad_locations} records store city/province inside location field")

        # Disaster needs
        bad_needs = 0
        for d in seed_disasters.iterator():
            for need in d.needs or []:
                if need not in VALID_NEEDS:
                    bad_needs += 1
        if bad_needs:
            issues.append(f"{bad_needs} invalid disaster need values")

        # Mission visibility
        published = seed_missions.filter(status=MissionStatus.PUBLISHED.value).count()
        visible = seed_missions.filter(is_visible_to_volunteers=True).count()
        apply_open = seed_missions.filter(
            allow_volunteer_applications=True,
            status=MissionStatus.PUBLISHED.value,
        ).count()
        if published == 0:
            issues.append("No published seed missions")
        if apply_open == 0:
            warnings.append("No missions open for volunteer applications")

        inbox = MissionApplication.objects.filter(
            mission__in=seed_missions,
            status__in=[
                MissionApplicationStatus.SUBMITTED.value,
                MissionApplicationStatus.WAITLIST.value,
            ],
        ).count()
        self.stdout.write(f"\nInbox applications (submitted/waitlist): {inbox}")

        # Active disasters should exist for missions
        active_disasters = seed_disasters.filter(status=DisasterStatus.ACTIVE.value).count()
        if active_disasters == 0:
            issues.append("No active seed disasters")

        # Mission without disaster
        orphan = seed_missions.filter(disaster__isnull=True).count()
        if orphan:
            issues.append(f"{orphan} missions without disaster")

        self.stdout.write("\n=== SUMMARY ===")
        if issues:
            self.stdout.write(self.style.ERROR(f"ISSUES ({len(issues)}):"))
            for item in issues:
                self.stdout.write(self.style.ERROR(f"  - {item}"))
        else:
            self.stdout.write(self.style.SUCCESS("No critical issues found."))

        if warnings:
            self.stdout.write(self.style.WARNING(f"WARNINGS ({len(warnings)}):"))
            for item in warnings:
                self.stdout.write(self.style.WARNING(f"  - {item}"))
