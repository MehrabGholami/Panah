from __future__ import annotations

from django.db.models import Count, Q

from assignments.domain.enums import AssignmentStatus
from common.exceptions.api_exceptions import NotFoundError
from missions.domain.enums import MissionApplicationStatus, MissionStatus
from missions.models import Mission
from reports.domain.enums import ReportStatus
from reports.models import MissionReport


FINISHED_STATUSES = (MissionStatus.COMPLETED.value, MissionStatus.CLOSED.value)


class FinishedMissionReportService:
    def list_finished_missions(self):
        return (
            Mission.objects.filter(status__in=FINISHED_STATUSES)
            .select_related("disaster", "coordinator")
            .annotate(
                applications_total=Count("applications", distinct=True),
                applications_approved=Count(
                    "applications",
                    filter=Q(applications__status=MissionApplicationStatus.APPROVED.value),
                    distinct=True,
                ),
                assignments_total=Count("assignments", distinct=True),
                assignments_completed=Count(
                    "assignments",
                    filter=Q(assignments__status=AssignmentStatus.COMPLETED.value),
                    distinct=True,
                ),
                assignments_checked_in=Count(
                    "assignments",
                    filter=Q(assignments__status=AssignmentStatus.CHECKED_IN.value),
                    distinct=True,
                ),
                reports_total=Count("reports", distinct=True),
            )
            .order_by("-updated_at")
        )

    def get_finished_mission(self, mission_id) -> Mission:
        mission = (
            self.list_finished_missions()
            .filter(pk=mission_id)
            .first()
        )
        if not mission:
            raise NotFoundError("Finished mission not found.")
        return mission

    def build_summary(self, mission: Mission) -> dict:
        applications = list(
            mission.applications.select_related("volunteer__user").order_by("-created_at")[:50]
        )
        assignments = list(
            mission.assignments.select_related("volunteer__user").order_by("-created_at")[:50]
        )
        reports = list(
            MissionReport.objects.filter(mission=mission)
            .select_related("author")
            .order_by("-created_at")
        )

        return {
            "id": str(mission.pk),
            "title": mission.title,
            "description": mission.description,
            "status": mission.status,
            "priority": mission.priority,
            "disaster_id": str(mission.disaster_id) if mission.disaster_id else None,
            "disaster_title": mission.disaster.title if mission.disaster_id else None,
            "coordinator_name": self._user_name(mission.coordinator),
            "coordinator_email": mission.coordinator.email if mission.coordinator_id else None,
            "location_display": mission.location_display,
            "province": mission.province,
            "city": mission.city,
            "location": mission.location,
            "start_time": mission.start_time,
            "end_time": mission.end_time,
            "required_volunteers": mission.required_volunteers,
            "equipment_needed": mission.equipment_needed,
            "safety_notes": mission.safety_notes,
            "special_considerations": mission.special_considerations,
            "applications_total": getattr(mission, "applications_total", mission.applications.count()),
            "applications_approved": getattr(
                mission,
                "applications_approved",
                mission.applications.filter(status=MissionApplicationStatus.APPROVED.value).count(),
            ),
            "assignments_total": getattr(mission, "assignments_total", mission.assignments.count()),
            "assignments_completed": getattr(
                mission,
                "assignments_completed",
                mission.assignments.filter(status=AssignmentStatus.COMPLETED.value).count(),
            ),
            "assignments_checked_in": getattr(
                mission,
                "assignments_checked_in",
                mission.assignments.filter(status=AssignmentStatus.CHECKED_IN.value).count(),
            ),
            "reports_total": getattr(mission, "reports_total", MissionReport.objects.filter(mission=mission).count()),
            "has_submitted_report": any(r.status == ReportStatus.SUBMITTED.value for r in reports)
            or any(r.status == ReportStatus.REVIEWED.value for r in reports),
            "created_at": mission.created_at,
            "updated_at": mission.updated_at,
            "applications": [
                {
                    "id": str(app.pk),
                    "volunteer_name": self._user_name(app.volunteer.user),
                    "volunteer_email": app.volunteer.user.email,
                    "status": app.status,
                    "created_at": app.created_at,
                }
                for app in applications
            ],
            "assignments": [
                {
                    "id": str(assignment.pk),
                    "volunteer_name": self._user_name(assignment.volunteer.user),
                    "volunteer_email": assignment.volunteer.user.email,
                    "status": assignment.status,
                    "created_at": assignment.created_at,
                }
                for assignment in assignments
            ],
            "reports": [
                {
                    "id": str(report.pk),
                    "author_name": self._user_name(report.author),
                    "author_email": report.author.email if report.author_id else None,
                    "content": report.content,
                    "status": report.status,
                    "created_at": report.created_at,
                }
                for report in reports
            ],
        }

    def build_list_item(self, mission: Mission) -> dict:
        return {
            "id": str(mission.pk),
            "title": mission.title,
            "status": mission.status,
            "priority": mission.priority,
            "disaster_title": mission.disaster.title if mission.disaster_id else None,
            "coordinator_name": self._user_name(mission.coordinator),
            "coordinator_email": mission.coordinator.email if mission.coordinator_id else None,
            "location_display": mission.location_display,
            "start_time": mission.start_time,
            "end_time": mission.end_time,
            "required_volunteers": mission.required_volunteers,
            "applications_total": mission.applications_total,
            "applications_approved": mission.applications_approved,
            "assignments_total": mission.assignments_total,
            "assignments_completed": mission.assignments_completed,
            "assignments_checked_in": mission.assignments_checked_in,
            "reports_total": mission.reports_total,
            "created_at": mission.created_at,
            "updated_at": mission.updated_at,
        }

    @staticmethod
    def _user_name(user) -> str | None:
        if not user:
            return None
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email
