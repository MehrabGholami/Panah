from __future__ import annotations

from datetime import timedelta

from django.core.cache import cache
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from accounts.application.services.permission_service import PermissionService
from accounts.domain.enums import SystemRole
from assignments.domain.enums import AssignmentStatus
from assignments.models import Assignment
from disasters.domain.enums import DisasterStatus
from disasters.models import Disaster
from missions.domain.enums import MissionApplicationStatus, MissionStatus
from missions.models import Mission, MissionApplication
from notifications.infrastructure.repositories.notification_repository import NotificationRepository
from reports.domain.enums import ReportStatus
from reports.models import MissionReport
from volunteers.domain.enums import VolunteerStatus
from volunteers.infrastructure.repositories.volunteer_repository import VolunteerRepository

DASHBOARD_CACHE_TTL = 30
DASHBOARD_CACHE_VERSION_KEY = "dashboard:version"


class DashboardService:
    def get_stats(self, user) -> dict:
        version = cache.get(DASHBOARD_CACHE_VERSION_KEY, 0)
        cache_key = f"dashboard:stats:{user.pk}:v{version}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        stats = self._compute_stats(user)
        cache.set(cache_key, stats, timeout=DASHBOARD_CACHE_TTL)
        return stats

    @staticmethod
    def bump_cache_version() -> None:
        version = cache.get(DASHBOARD_CACHE_VERSION_KEY, 0)
        cache.set(DASHBOARD_CACHE_VERSION_KEY, version + 1, timeout=None)

    def _compute_stats(self, user) -> dict:
        roles = self._get_user_roles(user)
        permissions = PermissionService().get_user_permissions(user)

        if SystemRole.ADMIN.value in roles:
            return self._compute_staff_stats(user, roles, permissions)

        if SystemRole.COORDINATOR.value in roles:
            return self._compute_coordinator_stats(user, roles)

        if self._is_staff_dashboard(roles, permissions):
            return self._compute_staff_stats(user, roles, permissions)

        return self._compute_volunteer_stats(user, roles)

    def _compute_coordinator_stats(self, user, roles: list[str]) -> dict:
        my_missions = Mission.objects.filter(coordinator_id=user.pk)
        my_mission_ids = list(my_missions.values_list("pk", flat=True))

        status_counts = dict(
            my_missions.values("status")
            .annotate(total=Count("id"))
            .values_list("status", "total")
        )
        draft = status_counts.get(MissionStatus.DRAFT, 0)
        published = status_counts.get(MissionStatus.PUBLISHED, 0)
        in_progress = status_counts.get(MissionStatus.IN_PROGRESS, 0)
        completed = status_counts.get(MissionStatus.COMPLETED, 0)
        total = sum(status_counts.values())

        pending_applications = MissionApplication.objects.filter(
            mission_id__in=my_mission_ids,
            status__in=[
                MissionApplicationStatus.SUBMITTED,
                MissionApplicationStatus.WAITLIST,
            ],
        ).count()

        active_assignments = Assignment.objects.filter(
            mission_id__in=my_mission_ids,
            status__in=[
                AssignmentStatus.PENDING,
                AssignmentStatus.ACCEPTED,
                AssignmentStatus.CHECKED_IN,
            ],
        ).count()

        pending_reports = MissionReport.objects.filter(
            mission_id__in=my_mission_ids,
            status=ReportStatus.SUBMITTED,
        ).count()

        kpis = {
            "my_missions_total": total,
            "my_missions_draft": draft,
            "my_missions_published": published,
            "my_missions_in_progress": in_progress,
            "open_missions": published + in_progress,
            "missions_in_progress": in_progress,
            "completed_missions": completed,
            "pending_applications": pending_applications,
            "active_assignments": active_assignments,
            "pending_reports": pending_reports,
            "unread_notifications": NotificationRepository().unread_count_for_user(
                user.pk
            ),
        }

        charts = {
            "disaster_status": [],
            "mission_status": self._mission_status_chart(coordinator_id=user.pk),
            "volunteer_pipeline": [],
            "mission_application_status": self._mission_application_status_chart(
                coordinator_id=user.pk
            ),
            "assignment_status": self._assignment_status_chart(coordinator_id=user.pk),
            "activity_trend": self._merge_trend(
                [],
                self._mission_trend(coordinator_id=user.pk),
                "missions",
            ),
            "my_application_status": [],
            "my_assignment_status": [],
        }

        return {
            "scope": "coordinator",
            "role": roles[0] if roles else SystemRole.COORDINATOR.value,
            "kpis": kpis,
            "charts": charts,
        }

    def _compute_staff_stats(self, user, roles: list[str], permissions: set[str]) -> dict:
        can_disasters = "disasters.view" in permissions or SystemRole.ADMIN.value in roles
        can_missions = "missions.view" in permissions or SystemRole.ADMIN.value in roles
        can_volunteers = self._can_view_volunteer_stats(permissions, roles)
        can_reports = "reports.view" in permissions or SystemRole.ADMIN.value in roles

        kpis: dict = {}
        charts: dict = {
            "disaster_status": [],
            "mission_status": [],
            "volunteer_pipeline": [],
            "mission_application_status": [],
            "assignment_status": [],
            "activity_trend": [],
            "my_application_status": [],
            "my_assignment_status": [],
            "skill_distribution": [],
            "gender_distribution": [],
        }

        if can_disasters:
            kpis.update(self._disaster_kpis())
            charts["disaster_status"] = self._disaster_status_chart()
            charts["activity_trend"] = self._merge_trend(
                charts.get("activity_trend", []),
                self._disaster_trend(),
                "disasters",
            )

        if can_missions:
            kpis.update(self._mission_kpis())
            charts["mission_status"] = self._mission_status_chart()
            charts["activity_trend"] = self._merge_trend(
                charts.get("activity_trend", []),
                self._mission_trend(),
                "missions",
            )
            if can_volunteers:
                kpis["pending_applications"] = MissionApplication.objects.filter(
                    status__in=[
                        MissionApplicationStatus.SUBMITTED,
                        MissionApplicationStatus.WAITLIST,
                    ]
                ).count()

        if can_volunteers:
            kpis.update(self._volunteer_kpis())
            charts["skill_distribution"] = self._skill_distribution_chart()
            charts["gender_distribution"] = self._gender_distribution_chart()

        if can_missions and can_volunteers:
            charts["mission_application_status"] = self._mission_application_status_chart()
            kpis.update(self._assignment_kpis())
            charts["assignment_status"] = self._assignment_status_chart()

        if can_reports:
            kpis["pending_reports"] = MissionReport.objects.filter(
                status=ReportStatus.SUBMITTED
            ).count()

        kpis["unread_notifications"] = NotificationRepository().unread_count_for_user(
            user.pk
        )

        return {
            "scope": "staff",
            "role": roles[0] if roles else "unknown",
            "kpis": kpis,
            "charts": charts,
        }

    def _compute_volunteer_stats(self, user, roles: list[str]) -> dict:
        from volunteers.models import VolunteerProfile

        volunteer_profile = VolunteerProfile.objects.filter(user_id=user.pk).first()
        kpis: dict = {
            "available_missions": Mission.objects.filter(
                status=MissionStatus.PUBLISHED,
                is_visible_to_volunteers=True,
            ).count(),
            "unread_notifications": NotificationRepository().unread_count_for_user(user.pk),
        }
        charts: dict = {
            "disaster_status": [],
            "mission_status": [],
            "volunteer_pipeline": [],
            "mission_application_status": [],
            "assignment_status": [],
            "activity_trend": [],
            "my_application_status": [],
            "my_assignment_status": [],
        }

        if volunteer_profile:
            applications = MissionApplication.objects.filter(volunteer=volunteer_profile)
            assignments = Assignment.objects.filter(volunteer=volunteer_profile)

            kpis.update(
                {
                    "my_applications_total": applications.count(),
                    "my_applications_pending": applications.filter(
                        status__in=[
                            MissionApplicationStatus.SUBMITTED,
                            MissionApplicationStatus.WAITLIST,
                        ]
                    ).count(),
                    "my_applications_approved": applications.filter(
                        status=MissionApplicationStatus.APPROVED
                    ).count(),
                    "my_assignments_active": assignments.filter(
                        status__in=[
                            AssignmentStatus.PENDING,
                            AssignmentStatus.ACCEPTED,
                            AssignmentStatus.CHECKED_IN,
                        ]
                    ).count(),
                    "my_assignments_completed": assignments.filter(
                        status=AssignmentStatus.COMPLETED
                    ).count(),
                    "my_missions_in_progress": assignments.filter(
                        mission__status=MissionStatus.IN_PROGRESS,
                        status__in=[
                            AssignmentStatus.ACCEPTED,
                            AssignmentStatus.CHECKED_IN,
                        ],
                    ).count(),
                }
            )
            charts["my_application_status"] = self._volunteer_application_chart(applications)
            charts["my_assignment_status"] = self._volunteer_assignment_chart(assignments)

        return {
            "scope": "volunteer",
            "role": roles[0] if roles else SystemRole.VOLUNTEER.value,
            "kpis": kpis,
            "charts": charts,
        }

    def _volunteer_application_chart(self, applications) -> list[dict]:
        labels = {
            MissionApplicationStatus.SUBMITTED: "در انتظار بررسی",
            MissionApplicationStatus.WAITLIST: "لیست انتظار",
            MissionApplicationStatus.APPROVED: "تأییدشده",
            MissionApplicationStatus.REJECTED: "ردشده",
            MissionApplicationStatus.WITHDRAWN: "انصراف",
        }
        rows = (
            applications.values("status")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        return [
            {
                "key": row["status"],
                "label": labels.get(row["status"], row["status"]),
                "value": row["value"],
            }
            for row in rows
            if row["value"] > 0
        ]

    def _volunteer_assignment_chart(self, assignments) -> list[dict]:
        labels = {
            AssignmentStatus.PENDING: "در انتظار پاسخ",
            AssignmentStatus.ACCEPTED: "پذیرفته",
            AssignmentStatus.CHECKED_IN: "حاضر در محل",
            AssignmentStatus.COMPLETED: "تکمیل‌شده",
            AssignmentStatus.DECLINED: "رد شده",
        }
        rows = (
            assignments.values("status")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        return [
            {
                "key": row["status"],
                "label": labels.get(row["status"], row["status"]),
                "value": row["value"],
            }
            for row in rows
            if row["value"] > 0
        ]

    @staticmethod
    def _is_staff_dashboard(roles: list[str], permissions: set[str]) -> bool:
        staff_roles = {SystemRole.ADMIN.value, SystemRole.COORDINATOR.value}
        if staff_roles.intersection(roles):
            return True
        return (
            "disasters.view" in permissions
            or "volunteers.view" in permissions
            or "volunteers.approve" in permissions
            or "reports.view" in permissions
        )

    def _disaster_kpis(self) -> dict:
        counts = dict(
            Disaster.objects.values("status")
            .annotate(total=Count("id"))
            .values_list("status", "total")
        )
        active = counts.get(DisasterStatus.ACTIVE, 0)
        inactive = counts.get(DisasterStatus.INACTIVE, 0)
        return {
            "active_disasters": active,
            "inactive_disasters": inactive,
            "total_disasters": sum(counts.values()),
        }

    def _mission_kpis(self) -> dict:
        active_disaster_q = Q(disaster__status=DisasterStatus.ACTIVE)
        open_statuses = [MissionStatus.PUBLISHED, MissionStatus.IN_PROGRESS]
        return {
            "open_missions": Mission.objects.filter(
                active_disaster_q,
                status__in=open_statuses,
            ).count(),
            "missions_in_progress": Mission.objects.filter(
                active_disaster_q,
                status=MissionStatus.IN_PROGRESS,
            ).count(),
            "completed_missions": Mission.objects.filter(
                status=MissionStatus.COMPLETED,
            ).count(),
        }

    def _volunteer_kpis(self) -> dict:
        repo = VolunteerRepository()
        return {
            "active_volunteers": repo.count_by_status(VolunteerStatus.ACTIVE),
        }

    def _assignment_kpis(self) -> dict:
        active_statuses = [
            AssignmentStatus.ACCEPTED,
            AssignmentStatus.CHECKED_IN,
        ]
        return {
            "active_assignments": Assignment.objects.filter(
                status__in=active_statuses,
                mission__disaster__status=DisasterStatus.ACTIVE,
            ).count(),
        }

    def _disaster_status_chart(self) -> list[dict]:
        labels = {
            DisasterStatus.ACTIVE: "فعال",
            DisasterStatus.INACTIVE: "غیرفعال",
            DisasterStatus.RESOLVED: "رفع‌شده",
            DisasterStatus.ARCHIVED: "بایگانی",
        }
        rows = (
            Disaster.objects.values("status")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        return [
            {
                "key": row["status"],
                "label": labels.get(row["status"], row["status"]),
                "value": row["value"],
            }
            for row in rows
            if row["value"] > 0
        ]

    def _mission_status_chart(self, coordinator_id=None) -> list[dict]:
        labels = {
            MissionStatus.DRAFT: "پیش‌نویس",
            MissionStatus.PUBLISHED: "منتشرشده",
            MissionStatus.IN_PROGRESS: "در حال اجرا",
            MissionStatus.COMPLETED: "تکمیل‌شده",
            MissionStatus.CLOSED: "بسته‌شده",
        }
        qs = Mission.objects.all()
        if coordinator_id is not None:
            qs = qs.filter(coordinator_id=coordinator_id)
        else:
            qs = qs.filter(disaster__status=DisasterStatus.ACTIVE)
        rows = (
            qs.values("status")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        return [
            {
                "key": row["status"],
                "label": labels.get(row["status"], row["status"]),
                "value": row["value"],
            }
            for row in rows
            if row["value"] > 0
        ]

    def _mission_application_status_chart(self, coordinator_id=None) -> list[dict]:
        labels = {
            MissionApplicationStatus.SUBMITTED: "در انتظار بررسی",
            MissionApplicationStatus.WAITLIST: "لیست انتظار",
            MissionApplicationStatus.APPROVED: "تأییدشده",
            MissionApplicationStatus.REJECTED: "ردشده",
            MissionApplicationStatus.WITHDRAWN: "انصراف",
        }
        qs = MissionApplication.objects.all()
        if coordinator_id is not None:
            qs = qs.filter(mission__coordinator_id=coordinator_id)
        rows = (
            qs.values("status")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        return [
            {
                "key": row["status"],
                "label": labels.get(row["status"], row["status"]),
                "value": row["value"],
            }
            for row in rows
            if row["value"] > 0
        ]

    def _skill_distribution_chart(self, limit: int = 10) -> list[dict]:
        """Top skills among registered volunteers (catalog + custom skills)."""
        from collections import Counter

        from skills.models import VolunteerSkill
        from volunteers.models import VolunteerProfile

        rows = (
            VolunteerSkill.objects.select_related("skill")
            .values("skill__name")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        counter: Counter[str] = Counter(
            {row["skill__name"]: row["value"] for row in rows if row["skill__name"]}
        )

        for custom_list in VolunteerProfile.objects.exclude(custom_skills=[]).values_list(
            "custom_skills", flat=True
        ):
            if not isinstance(custom_list, list):
                continue
            for name in custom_list:
                normalized = str(name).strip()
                if normalized:
                    counter[normalized] += 1

        if not counter:
            return []

        top = counter.most_common(limit)
        shown_keys = {name for name, _ in top}
        other_total = sum(value for name, value in counter.items() if name not in shown_keys)

        result = [
            {"key": name, "label": name, "value": value}
            for name, value in top
            if value > 0
        ]
        if other_total > 0:
            result.append({"key": "other", "label": "سایر", "value": other_total})
        return result

    def _gender_distribution_chart(self) -> list[dict]:
        from volunteers.domain.enums import VolunteerGender
        from volunteers.models import VolunteerProfile

        labels = {
            VolunteerGender.FEMALE: "خانم",
            VolunteerGender.MALE: "آقا",
            VolunteerGender.UNSPECIFIED: "نامشخص",
        }
        rows = (
            VolunteerProfile.objects.exclude(gender="other")
            .values("gender")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        return [
            {
                "key": row["gender"] or VolunteerGender.UNSPECIFIED,
                "label": labels.get(
                    row["gender"] or VolunteerGender.UNSPECIFIED,
                    row["gender"] or VolunteerGender.UNSPECIFIED,
                ),
                "value": row["value"],
            }
            for row in rows
            if row["value"] > 0
        ]

    def _assignment_status_chart(self, coordinator_id=None) -> list[dict]:
        labels = {
            AssignmentStatus.PENDING: "در انتظار",
            AssignmentStatus.ACCEPTED: "پذیرفته",
            AssignmentStatus.CHECKED_IN: "حاضر در محل",
            AssignmentStatus.COMPLETED: "تکمیل",
            AssignmentStatus.DECLINED: "رد شده",
        }
        qs = Assignment.objects.all()
        if coordinator_id is not None:
            qs = qs.filter(mission__coordinator_id=coordinator_id)
        else:
            qs = qs.filter(mission__disaster__status=DisasterStatus.ACTIVE)
        rows = (
            qs.values("status")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        return [
            {
                "key": row["status"],
                "label": labels.get(row["status"], row["status"]),
                "value": row["value"],
            }
            for row in rows
            if row["value"] > 0
        ]

    def _disaster_trend(self) -> dict[str, int]:
        since = timezone.now() - timedelta(days=6)
        rows = (
            Disaster.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Count("id"))
        )
        return {row["day"].isoformat(): row["total"] for row in rows if row["day"]}

    def _mission_trend(self, coordinator_id=None) -> dict[str, int]:
        since = timezone.now() - timedelta(days=6)
        qs = Mission.objects.filter(created_at__gte=since)
        if coordinator_id is not None:
            qs = qs.filter(coordinator_id=coordinator_id)
        rows = (
            qs.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Count("id"))
        )
        return {row["day"].isoformat(): row["total"] for row in rows if row["day"]}

    def _merge_trend(
        self,
        current: list[dict],
        daily_map: dict[str, int],
        field: str,
    ) -> list[dict]:
        by_date = {item["date"]: dict(item) for item in current}
        for day in self._last_seven_days():
            entry = by_date.setdefault(day, {"date": day, "missions": 0, "disasters": 0})
            entry[field] = daily_map.get(day, 0)
        return [by_date[day] for day in self._last_seven_days()]

    @staticmethod
    def _last_seven_days() -> list[str]:
        today = timezone.localdate()
        return [(today - timedelta(days=offset)).isoformat() for offset in range(6, -1, -1)]

    @staticmethod
    def _get_user_roles(user) -> list[str]:
        return list(
            user.user_roles.select_related("role").values_list("role__slug", flat=True)
        )

    @staticmethod
    def _can_view_volunteer_stats(permissions: set[str], roles: list[str]) -> bool:
        return (
            "volunteers.view" in permissions
            or "volunteers.approve" in permissions
            or SystemRole.ADMIN.value in roles
            or SystemRole.COORDINATOR.value in roles
        )
