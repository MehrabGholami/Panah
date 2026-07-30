from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone

from accounts.application.services.seed_service import SeedService
from accounts.models import Role, User, UserProfile, UserRole
from assignments.domain.enums import AssignmentStatus
from assignments.models import Assignment
from config.data.persian_seed_data import (
    APPLICATION_MESSAGES,
    AVAILABILITY_PRESETS,
    BIOS,
    BLOOD_TYPES,
    COORDINATOR_NAMES,
    CUSTOM_SKILLS,
    DISASTER_DESCRIPTIONS,
    DISASTER_NEEDS_BY_TYPE,
    DISASTER_TITLES,
    EDUCATIONS,
    FIRST_NAMES,
    LANGUAGES,
    LAST_NAMES,
    LOCATIONS,
    MISSION_TEMPLATES,
    OCCUPATIONS,
    PROVINCES_CITIES,
    REJECT_NOTES,
    SEED_EMAIL_DOMAIN,
)
from disasters.domain.enums import DisasterSeverity, DisasterStatus, DisasterType
from disasters.models import Disaster
from missions.domain.enums import MissionApplicationStatus, MissionPriority, MissionStatus
from missions.models import Mission, MissionApplication, MissionRequiredSkill
from notifications.models import Notification
from reports.domain.enums import ReportStatus
from reports.models import MissionReport
from skills.models import Skill, VolunteerSkill
from volunteers.domain.enums import VolunteerStatus
from volunteers.models import VolunteerProfile

BATCH_SIZE = 250


@dataclass
class BulkSeedResult:
    volunteers: int = 0
    coordinators: int = 0
    disasters: int = 0
    missions: int = 0
    applications: int = 0
    assignments: int = 0
    volunteer_skills: int = 0
    profiles: int = 0
    batch_id: str = ""


class BulkSeedService:
    def __init__(self, seed: int = 42):
        self.rng = random.Random(seed)
        self.batch_id = f"bulk-{seed}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

    def run(
        self,
        *,
        volunteers: int = 800,
        disasters: int = 25,
        missions: int = 100,
        password: str,
        clear: bool = False,
        admin_email: str,
        admin_password: str,
    ) -> BulkSeedResult:
        result = BulkSeedResult(batch_id=self.batch_id)
        with transaction.atomic():
            SeedService().seed_all(admin_email=admin_email, admin_password=admin_password)
            if clear:
                self._clear_seed_data()

            volunteer_role = Role.objects.get(slug="volunteer")
            coordinator_role = Role.objects.get(slug="coordinator")
            skills = list(Skill.objects.all().order_by("name"))
            if not skills:
                raise RuntimeError("No skills found. Run seed_data first.")

            coordinators = self._seed_coordinators(
                coordinator_role,
                password,
                count=min(8, max(3, disasters // 4)),
            )
            result.coordinators = len(coordinators)

            volunteer_users, volunteer_profiles = self._seed_volunteers(
                volunteers,
                password,
                volunteer_role,
                skills,
            )
            result.volunteers = len(volunteer_users)
            result.volunteer_skills = VolunteerSkill.objects.filter(
                volunteer__user__email__endswith=SEED_EMAIL_DOMAIN,
            ).count()
            result.profiles = UserProfile.objects.filter(
                user__email__endswith=SEED_EMAIL_DOMAIN,
            ).count()

            disaster_records = self._seed_disasters(disasters)
            result.disasters = len(disaster_records)

            mission_records = self._seed_missions(
                missions,
                disaster_records,
                coordinators,
                skills,
            )
            result.missions = len(mission_records)

            active_volunteers = [
                vp for vp in volunteer_profiles if vp.status == VolunteerStatus.ACTIVE
            ]
            apps, assignments = self._seed_applications_and_assignments(
                mission_records,
                active_volunteers,
                coordinators[0],
            )
            result.applications = apps
            result.assignments = assignments
            self._seed_mission_reports(mission_records, coordinators)
            self._seed_notifications(mission_records, coordinators, admin_email=admin_email)

        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return result

    def _clear_seed_data(self) -> None:
        seed_user_ids = list(
            User.all_objects.filter(email__endswith=SEED_EMAIL_DOMAIN).values_list("pk", flat=True)
        )
        mission_ids = list(
            Mission.all_objects.filter(metadata__seed=True).values_list("pk", flat=True)
        )

        if mission_ids:
            app_ids = list(
                MissionApplication.all_objects.filter(mission_id__in=mission_ids).values_list(
                    "pk", flat=True
                )
            )
            if app_ids:
                Notification.all_objects.filter(
                    resource_type="mission_application",
                    resource_id__in=[str(pk) for pk in app_ids],
                ).delete()
            MissionReport.all_objects.filter(mission_id__in=mission_ids).delete()
            MissionApplication.all_objects.filter(mission_id__in=mission_ids).delete()
            Assignment.all_objects.filter(mission_id__in=mission_ids).delete()
            MissionRequiredSkill.all_objects.filter(mission_id__in=mission_ids).delete()
            Mission.all_objects.filter(pk__in=mission_ids).delete()

        Disaster.all_objects.filter(metadata__seed=True).delete()

        if seed_user_ids:
            Notification.all_objects.filter(user_id__in=seed_user_ids).delete()
            VolunteerSkill.all_objects.filter(volunteer__user_id__in=seed_user_ids).delete()
            VolunteerProfile.all_objects.filter(user_id__in=seed_user_ids).delete()
            UserProfile.all_objects.filter(user_id__in=seed_user_ids).delete()
            UserRole.all_objects.filter(user_id__in=seed_user_ids).delete()
            User.all_objects.filter(pk__in=seed_user_ids).delete()

    def _seed_coordinators(
        self,
        coordinator_role: Role,
        password: str,
        count: int,
    ) -> list[User]:
        password_hash = make_password(password)
        users: list[User] = []
        roles: list[UserRole] = []

        for index in range(1, count + 1):
            first_name, last_name = COORDINATOR_NAMES[(index - 1) % len(COORDINATOR_NAMES)]
            users.append(
                User(
                    email=f"coordinator{index}{SEED_EMAIL_DOMAIN}",
                    first_name=first_name,
                    last_name=last_name,
                    phone=self._phone(index + 9000),
                    is_approved=True,
                    is_active=True,
                    password=password_hash,
                )
            )

        User.objects.bulk_create(users, batch_size=BATCH_SIZE)
        for user in users:
            roles.append(UserRole(user_id=user.pk, role_id=coordinator_role.pk))
        UserRole.objects.bulk_create(roles, batch_size=BATCH_SIZE, ignore_conflicts=True)
        return users

    def _seed_volunteers(
        self,
        count: int,
        password: str,
        volunteer_role: Role,
        skills: list[Skill],
    ) -> tuple[list[User], list[VolunteerProfile]]:
        password_hash = make_password(password)
        status_pool = self._build_status_pool(count)

        users: list[User] = []
        for index in range(1, count + 1):
            users.append(
                User(
                    email=f"volunteer{index}{SEED_EMAIL_DOMAIN}",
                    first_name=self.rng.choice(FIRST_NAMES),
                    last_name=self.rng.choice(LAST_NAMES),
                    phone=self._phone(index),
                    is_approved=status_pool[index - 1] == VolunteerStatus.ACTIVE,
                    is_active=True,
                    password=password_hash,
                )
            )

        User.objects.bulk_create(users, batch_size=BATCH_SIZE)

        user_roles = [UserRole(user_id=user.pk, role_id=volunteer_role.pk) for user in users]
        UserRole.objects.bulk_create(user_roles, batch_size=BATCH_SIZE, ignore_conflicts=True)

        profiles: list[VolunteerProfile] = []
        user_profiles: list[UserProfile] = []

        for index, user in enumerate(users, start=1):
            province, city = self._random_province_city()
            status = status_pool[index - 1]
            profile_tier = self._profile_tier(status)

            profiles.append(
                VolunteerProfile(
                    user_id=user.pk,
                    national_id=self._national_id(index),
                    city=city if profile_tier != "minimal" else (city if index % 3 == 0 else ""),
                    bio=self.rng.choice(BIOS) if profile_tier in {"full", "partial"} else "",
                    gender=self.rng.choice(["female", "male", "female", "male", "unspecified"]),
                    status=status,
                    availability=self.rng.choice(AVAILABILITY_PRESETS) if profile_tier == "full" else {},
                    custom_skills=self._custom_skills() if profile_tier == "full" and index % 4 == 0 else [],
                )
            )

            if profile_tier in {"full", "partial"}:
                user_profiles.append(
                    self._build_user_profile(user.pk, profile_tier, province=province, city=city)
                )

        VolunteerProfile.objects.bulk_create(profiles, batch_size=BATCH_SIZE)
        if user_profiles:
            UserProfile.objects.bulk_create(user_profiles, batch_size=BATCH_SIZE)

        volunteer_by_user = {vp.user_id: vp for vp in profiles}
        skill_rows: list[VolunteerSkill] = []
        for user in users:
            volunteer = volunteer_by_user[user.pk]
            assigned = self.rng.sample(skills, k=self.rng.randint(2, min(5, len(skills))))
            for skill in assigned:
                skill_rows.append(
                    VolunteerSkill(
                        volunteer_id=volunteer.pk,
                        skill_id=skill.pk,
                        proficiency=self.rng.randint(2, 5),
                    )
                )

        VolunteerSkill.objects.bulk_create(skill_rows, batch_size=BATCH_SIZE, ignore_conflicts=True)
        return users, profiles

    def _seed_disasters(self, count: int) -> list[Disaster]:
        types = list(DisasterType)
        severities = [
            DisasterSeverity.LOW,
            DisasterSeverity.MEDIUM,
            DisasterSeverity.MEDIUM,
            DisasterSeverity.HIGH,
            DisasterSeverity.HIGH,
            DisasterSeverity.CRITICAL,
        ]
        statuses = (
            [DisasterStatus.ACTIVE] * 15
            + [DisasterStatus.RESOLVED] * 5
            + [DisasterStatus.INACTIVE] * 2
            + [DisasterStatus.ARCHIVED] * 3
        )
        self.rng.shuffle(statuses)

        disasters: list[Disaster] = []
        now = timezone.now()

        for index in range(count):
            disaster_type = types[index % len(types)]
            province, city = self._random_province_city()
            location = self._location_detail(province, city, self.rng.choice(LOCATIONS))
            title_tpl = self.rng.choice(DISASTER_TITLES[disaster_type.value])
            title = title_tpl.format(city=city, province=province, location=location)
            description = self.rng.choice(DISASTER_DESCRIPTIONS[disaster_type.value])
            needs = list(DISASTER_NEEDS_BY_TYPE[disaster_type.value])
            if self.rng.random() < 0.2:
                needs.append("other")

            days_ago = self.rng.randint(1, 90)
            disasters.append(
                Disaster(
                    title=title,
                    description=description,
                    disaster_type=disaster_type.value,
                    severity=self.rng.choice(severities).value,
                    province=province,
                    city=city,
                    location=location,
                    occurred_at=now - timedelta(days=days_ago, hours=self.rng.randint(0, 12)),
                    needs=needs[: self.rng.randint(3, len(needs))],
                    affected_population=self.rng.randint(200, 25000),
                    status=statuses[index % len(statuses)].value,
                    metadata={
                        "seed": True,
                        "batch": self.batch_id,
                        "other_needs": ["چادر اضطراری", "پتو"] if "other" in needs else [],
                    },
                )
            )

        Disaster.objects.bulk_create(disasters, batch_size=BATCH_SIZE)
        return disasters

    def _seed_missions(
        self,
        count: int,
        disasters: list[Disaster],
        coordinators: list[User],
        skills: list[Skill],
    ) -> list[Mission]:
        if not disasters:
            return []

        skill_by_name = {skill.name: skill for skill in skills}
        active_disasters = [d for d in disasters if d.status == DisasterStatus.ACTIVE.value]
        if not active_disasters:
            active_disasters = disasters

        status_weights = (
            [MissionStatus.PUBLISHED] * 40
            + [MissionStatus.IN_PROGRESS] * 25
            + [MissionStatus.COMPLETED] * 15
            + [MissionStatus.DRAFT] * 10
            + [MissionStatus.CLOSED] * 10
        )

        missions: list[Mission] = []
        required_skill_rows: list[MissionRequiredSkill] = []
        now = timezone.now()

        for index in range(count):
            disaster = (
                active_disasters[index % len(active_disasters)]
                if index < count * 0.85
                else self.rng.choice(disasters)
            )
            templates = MISSION_TEMPLATES.get(disaster.disaster_type, MISSION_TEMPLATES["other"])
            template = self.rng.choice(templates)
            status = status_weights[index % len(status_weights)].value
            location_ctx = {
                "city": disaster.city,
                "province": disaster.province,
                "location": disaster.location,
            }
            description = template.get(
                "description",
                f"{template['title']} — هماهنگی داوطلبان در محل بحران.",
            )

            start_offset = self.rng.randint(-10, 14)
            start_time = now + timedelta(days=start_offset, hours=self.rng.randint(6, 20))
            end_tba = self.rng.random() < 0.15
            end_time = None if end_tba else start_time + timedelta(days=self.rng.randint(2, 14))

            visible = status in {
                MissionStatus.PUBLISHED.value,
                MissionStatus.IN_PROGRESS.value,
                MissionStatus.COMPLETED.value,
            }
            allow_apply = (
                visible
                and status == MissionStatus.PUBLISHED.value
                and self.rng.random() < 0.7
            )

            min_vol, max_vol = template.get("volunteers", (10, 30))
            missions.append(
                Mission(
                    disaster_id=disaster.pk,
                    title=template["title"].format(**location_ctx),
                    description=description.format(**location_ctx),
                    coordinator_id=self.rng.choice(coordinators).pk,
                    status=status,
                    priority=template.get("priority", MissionPriority.MEDIUM.value),
                    province=disaster.province,
                    city=disaster.city,
                    location=disaster.location,
                    start_time=start_time,
                    end_time=end_time,
                    is_end_time_tba=end_tba,
                    required_volunteers=self.rng.randint(min_vol, max_vol),
                    special_considerations="اولویت با داوطلبان ساکن همان استان است."
                    if self.rng.random() < 0.4
                    else "",
                    equipment_needed=template.get("equipment", ""),
                    safety_notes=template.get("safety", "رعایت کامل دستورالعمل‌های ایمنی الزامی است."),
                    is_visible_to_volunteers=visible,
                    allow_volunteer_applications=allow_apply,
                    metadata={"seed": True, "batch": self.batch_id},
                )
            )

        Mission.objects.bulk_create(missions, batch_size=BATCH_SIZE)

        disaster_type_by_id = {d.pk: d.disaster_type for d in disasters}
        for mission in missions:
            disaster_type = disaster_type_by_id.get(mission.disaster_id, "other")
            templates = MISSION_TEMPLATES.get(disaster_type, MISSION_TEMPLATES["other"])
            template = self.rng.choice(templates)
            for skill_name in template.get("skills", [])[: self.rng.randint(1, 3)]:
                skill = skill_by_name.get(skill_name)
                if skill:
                    required_skill_rows.append(
                        MissionRequiredSkill(
                            mission_id=mission.pk,
                            skill_id=skill.pk,
                            is_required=self.rng.random() < 0.85,
                        )
                    )

        MissionRequiredSkill.objects.bulk_create(
            required_skill_rows,
            batch_size=BATCH_SIZE,
            ignore_conflicts=True,
        )
        return missions

    def _seed_applications_and_assignments(
        self,
        missions: list[Mission],
        active_volunteers: list[VolunteerProfile],
        reviewer: User,
    ) -> tuple[int, int]:
        if not missions or not active_volunteers:
            return 0, 0

        eligible_missions = [
            m
            for m in missions
            if m.allow_volunteer_applications and m.status == MissionStatus.PUBLISHED.value
        ]
        in_progress_missions = [m for m in missions if m.status == MissionStatus.IN_PROGRESS.value]

        applications: list[MissionApplication] = []
        assignments: list[Assignment] = []
        used_pairs: set[tuple[Any, Any]] = set()

        for mission in eligible_missions:
            applicant_count = self.rng.randint(
                max(5, len(active_volunteers) // 40),
                max(8, len(active_volunteers) // 15),
            )
            applicants = self.rng.sample(
                active_volunteers,
                k=min(applicant_count, len(active_volunteers)),
            )
            for volunteer in applicants:
                pair = (mission.pk, volunteer.pk)
                if pair in used_pairs:
                    continue
                used_pairs.add(pair)

                roll = self.rng.random()
                if roll < 0.4:
                    status = MissionApplicationStatus.SUBMITTED.value
                    reviewed_at = None
                    review_note = ""
                elif roll < 0.65:
                    status = MissionApplicationStatus.APPROVED.value
                    reviewed_at = timezone.now() - timedelta(hours=self.rng.randint(1, 72))
                    review_note = ""
                elif roll < 0.8:
                    status = MissionApplicationStatus.WAITLIST.value
                    reviewed_at = timezone.now() - timedelta(hours=self.rng.randint(1, 48))
                    review_note = ""
                elif roll < 0.95:
                    status = MissionApplicationStatus.REJECTED.value
                    reviewed_at = timezone.now() - timedelta(hours=self.rng.randint(1, 48))
                    review_note = self.rng.choice(REJECT_NOTES)
                else:
                    status = MissionApplicationStatus.WITHDRAWN.value
                    reviewed_at = None
                    review_note = ""

                applications.append(
                    MissionApplication(
                        mission_id=mission.pk,
                        volunteer_id=volunteer.pk,
                        message=self.rng.choice(APPLICATION_MESSAGES),
                        status=status,
                        reviewed_by_id=reviewer.pk if reviewed_at else None,
                        reviewed_at=reviewed_at,
                        review_note=review_note,
                    )
                )

        for mission in in_progress_missions:
            approved_count = self.rng.randint(3, min(12, len(active_volunteers)))
            approved_volunteers = self.rng.sample(active_volunteers, k=approved_count)
            for volunteer in approved_volunteers:
                pair = (mission.pk, volunteer.pk)
                if pair in used_pairs:
                    continue
                used_pairs.add(pair)
                applications.append(
                    MissionApplication(
                        mission_id=mission.pk,
                        volunteer_id=volunteer.pk,
                        message=self.rng.choice(APPLICATION_MESSAGES),
                        status=MissionApplicationStatus.APPROVED.value,
                        reviewed_by_id=reviewer.pk,
                        reviewed_at=timezone.now() - timedelta(days=self.rng.randint(1, 5)),
                    )
                )
                assignments.append(
                    Assignment(
                        mission_id=mission.pk,
                        volunteer_id=volunteer.pk,
                        status=self.rng.choice(
                            [
                                AssignmentStatus.ACCEPTED.value,
                                AssignmentStatus.CHECKED_IN.value,
                                AssignmentStatus.PENDING.value,
                            ]
                        ),
                    )
                )

        MissionApplication.objects.bulk_create(
            applications,
            batch_size=BATCH_SIZE,
            ignore_conflicts=True,
        )

        for app in applications:
            if app.status == MissionApplicationStatus.APPROVED.value and self.rng.random() < 0.35:
                pair = (app.mission_id, app.volunteer_id)
                if pair not in {(a.mission_id, a.volunteer_id) for a in assignments}:
                    assignments.append(
                        Assignment(
                            mission_id=app.mission_id,
                            volunteer_id=app.volunteer_id,
                            status=AssignmentStatus.ACCEPTED.value,
                        )
                    )

        Assignment.objects.bulk_create(
            assignments,
            batch_size=BATCH_SIZE,
            ignore_conflicts=True,
        )
        return len(applications), len(assignments)

    def _seed_mission_reports(self, missions: list[Mission], coordinators: list[User]) -> int:
        finished = [
            m
            for m in missions
            if m.status in (MissionStatus.COMPLETED.value, MissionStatus.CLOSED.value)
        ]
        if not finished or not coordinators:
            return 0

        report_bodies = [
            "عملیات با موفقیت انجام شد. تیم‌های امدادی طبق برنامه مستقر شدند و نیازمندی‌های فوری تأمین گردید.",
            "جمع‌بندی نهایی: توزیع اقلام تکمیل شد و آمار خانوارهای تحت پوشش ثبت گردید.",
            "گزارش پایانی: خطرات باقی‌مانده به تیم ایمنی منتقل شد و محل عملیات ایمن‌سازی گردید.",
        ]
        rows: list[MissionReport] = []
        for index, mission in enumerate(finished):
            if self.rng.random() < 0.25:
                continue
            status = (
                ReportStatus.REVIEWED.value
                if self.rng.random() < 0.35
                else ReportStatus.SUBMITTED.value
                if self.rng.random() < 0.7
                else ReportStatus.DRAFT.value
            )
            rows.append(
                MissionReport(
                    mission_id=mission.pk,
                    author_id=self.rng.choice(coordinators).pk,
                    content=report_bodies[index % len(report_bodies)],
                    status=status,
                )
            )
        MissionReport.objects.bulk_create(rows, batch_size=BATCH_SIZE)
        return len(rows)

    def _seed_notifications(
        self,
        missions: list[Mission],
        coordinators: list[User],
        *,
        admin_email: str,
    ) -> int:
        admin = User.objects.filter(email__iexact=admin_email).first()
        mission_by_id = {m.pk: m for m in missions}
        submitted = list(
            MissionApplication.objects.filter(
                mission_id__in=mission_by_id.keys(),
                status=MissionApplicationStatus.SUBMITTED.value,
            ).select_related("volunteer__user", "mission")[:80]
        )
        if not submitted:
            return 0

        rows: list[Notification] = []
        seen: set[tuple] = set()

        def add_row(user_id, title: str, message: str, resource_id) -> None:
            key = (str(user_id), str(resource_id), title)
            if not user_id or key in seen:
                return
            seen.add(key)
            rows.append(
                Notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    resource_type="mission_application",
                    resource_id=str(resource_id),
                    channel="in_app",
                )
            )

        for application in submitted:
            mission = mission_by_id.get(application.mission_id) or application.mission
            volunteer_name = (
                f"{application.volunteer.user.first_name} {application.volunteer.user.last_name}".strip()
                or application.volunteer.user.email
            )
            staff_message = (
                f"داوطلب {volunteer_name} برای مأموریت «{mission.title}» درخواست شرکت ثبت کرد."
            )
            add_row(
                mission.coordinator_id,
                "درخواست شرکت جدید",
                staff_message,
                application.pk,
            )
            if admin:
                add_row(admin.pk, "درخواست شرکت جدید", staff_message, application.pk)
            add_row(
                application.volunteer.user_id,
                "ثبت درخواست مأموریت",
                f"درخواست شما برای مأموریت «{mission.title}» ثبت شد و در انتظار بررسی است.",
                application.pk,
            )

        approved = list(
            MissionApplication.objects.filter(
                mission_id__in=mission_by_id.keys(),
                status=MissionApplicationStatus.APPROVED.value,
            ).select_related("volunteer__user", "mission")[:40]
        )
        for application in approved:
            mission = mission_by_id.get(application.mission_id) or application.mission
            add_row(
                application.volunteer.user_id,
                "تأیید درخواست مأموریت",
                f"درخواست شما برای مأموریت «{mission.title}» تأیید شد.",
                application.pk,
            )

        Notification.objects.bulk_create(rows, batch_size=BATCH_SIZE)
        return len(rows)

    def _build_status_pool(self, count: int) -> list[str]:
        pool = (
            [VolunteerStatus.ACTIVE.value] * int(count * 0.95)
            + [VolunteerStatus.REJECTED.value] * int(count * 0.05)
        )
        while len(pool) < count:
            pool.append(VolunteerStatus.ACTIVE.value)
        self.rng.shuffle(pool)
        return pool[:count]

    def _profile_tier(self, status: str) -> str:
        if status != VolunteerStatus.ACTIVE.value:
            return self.rng.choice(["partial", "minimal", "minimal"])
        roll = self.rng.random()
        if roll < 0.75:
            return "full"
        if roll < 0.92:
            return "partial"
        return "minimal"

    def _build_user_profile(
        self,
        user_id,
        tier: str,
        *,
        province: str = "",
        city: str = "",
    ) -> UserProfile:
        full = tier == "full"
        partial = tier == "partial"
        birth_year = self.rng.randint(1965, 2002)
        address = ""
        if full and province:
            address = f"{province}، {city}، خیابان {self.rng.randint(1, 120)}" if city else f"{province}، خیابان {self.rng.randint(1, 120)}"
        return UserProfile(
            user_id=user_id,
            education=self.rng.choice(EDUCATIONS) if full or partial else "",
            occupation=self.rng.choice(OCCUPATIONS) if full or (partial and self.rng.random() < 0.7) else "",
            interests="کمک به آسیب‌دیدگان، آموزش همگانی" if full else "",
            address=address,
            blood_type=self.rng.choice(BLOOD_TYPES) if full else "",
            languages=self.rng.choice(LANGUAGES) if full or (partial and self.rng.random() < 0.5) else "",
            years_of_experience=self.rng.randint(0, 25) if full else (self.rng.randint(1, 10) if partial else None),
            date_of_birth=date(birth_year, self.rng.randint(1, 12), self.rng.randint(1, 28)) if full else None,
            emergency_contact_name=self.rng.choice(FIRST_NAMES) + " " + self.rng.choice(LAST_NAMES) if full else "",
            emergency_contact_phone=self._phone(self.rng.randint(10000, 99999)) if full else "",
            medical_conditions="" if self.rng.random() < 0.85 else "آلرزی فصلی خفیف",
            disability="",
        )

    def _custom_skills(self) -> list[str]:
        return self.rng.sample(CUSTOM_SKILLS, k=self.rng.randint(1, 2))

    def _random_province_city(self) -> tuple[str, str]:
        province = self.rng.choice(list(PROVINCES_CITIES.keys()))
        city = self.rng.choice(PROVINCES_CITIES[province])
        return province, city

    def _location_detail(self, province: str, city: str, raw_location: str) -> str:
        """Store only address detail — province/city live in their own fields."""
        normalized = (raw_location or "").strip().replace("،", " — ")
        geo_labels = {province.strip(), city.strip()}
        segments = [segment.strip() for segment in normalized.split(" — ") if segment.strip()]
        detail_segments = [segment for segment in segments if segment not in geo_labels]
        if detail_segments:
            return " — ".join(detail_segments)
        if segments and segments[0] not in geo_labels:
            return segments[0]
        return self.rng.choice(LOCATIONS)

    def _phone(self, index: int) -> str:
        return f"0912{index:07d}"[-11:]

    def _national_id(self, index: int) -> str:
        return f"9{index:09d}"
