from __future__ import annotations

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from common.exceptions.api_exceptions import ConflictError, ValidationError
from common.services.base_service import BaseService
from missions.domain.enums import MissionApplicationStatus, MissionStatus
from missions.domain.exceptions import MissionNotFoundError
from missions.infrastructure.repositories.mission_repository import MissionRepository
from missions.models import Mission, MissionApplication, MissionRequiredSkill
from skills.models import Skill
from volunteers.infrastructure.repositories.volunteer_repository import VolunteerRepository

_ACTIVE_APPLICATION_STATUSES = (
    MissionApplicationStatus.SUBMITTED,
    MissionApplicationStatus.WAITLIST,
    MissionApplicationStatus.APPROVED,
)


class MissionService(BaseService):
    repository: MissionRepository

    _TRANSITIONS = {
        "publish": (MissionStatus.DRAFT, MissionStatus.PUBLISHED),
        "start": (MissionStatus.PUBLISHED, MissionStatus.IN_PROGRESS),
        "complete": (MissionStatus.IN_PROGRESS, MissionStatus.COMPLETED),
        "close": (MissionStatus.COMPLETED, MissionStatus.CLOSED),
    }

    def __init__(self, repository: MissionRepository | None = None):
        super().__init__(repository or MissionRepository())

    def _user_roles(self, user) -> set[str]:
        return set(user.user_roles.values_list("role__slug", flat=True))

    def _is_staff_role(self, user) -> bool:
        roles = self._user_roles(user)
        return bool(roles & {"admin", "coordinator"})

    def list_for_user(self, user):
        qs = self.repository.list_with_relations()
        if self._is_staff_role(user):
            return qs

        return qs.filter(
            status=MissionStatus.PUBLISHED,
            is_visible_to_volunteers=True,
        )

    def list(self):
        return self.repository.list_with_relations()

    def get(self, mission_id) -> Mission:
        mission = self.repository.get_by_id_with_relations(mission_id)
        if not mission:
            raise MissionNotFoundError()
        return mission

    def get_for_user(self, mission_id, user) -> Mission:
        mission = self.get(mission_id)
        if self._is_staff_role(user):
            return mission
        if (
            mission.status == MissionStatus.PUBLISHED
            and mission.is_visible_to_volunteers
        ):
            return mission
        raise MissionNotFoundError()

    def create(self, coordinator, required_skill_ids=None, actor=None, **data) -> Mission:
        data.setdefault("status", MissionStatus.DRAFT)
        mission = self.repository.create(coordinator=coordinator, **data)
        if required_skill_ids is not None:
            self._sync_required_skills(mission, required_skill_ids)
        AuditService().log(
            action=AuditAction.CREATE,
            resource_type="mission",
            resource_id=mission.pk,
        )
        self._notify_coordinator_assignment(
            mission,
            coordinator,
            actor=actor,
            previous_coordinator_id=None,
        )
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return self.get(mission.pk)

    def update(self, mission_id, required_skill_ids=None, actor=None, **data) -> Mission:
        mission = self.get(mission_id)
        if mission.status == MissionStatus.CLOSED:
            raise ValidationError("Closed missions cannot be updated.")
        data.pop("status", None)

        previous_coordinator_id = mission.coordinator_id
        coordinator_id = data.pop("coordinator", None)
        if coordinator_id is not None and actor is not None:
            coordinator_pk = getattr(coordinator_id, "pk", coordinator_id)
            data["coordinator"] = self.resolve_coordinator(actor, coordinator_pk)

        mission = self.repository.update(mission, **data)
        if required_skill_ids is not None:
            self._sync_required_skills(mission, required_skill_ids)

        if "coordinator" in data:
            self._notify_coordinator_assignment(
                mission,
                data["coordinator"],
                actor=actor,
                previous_coordinator_id=previous_coordinator_id,
            )
        return self.get(mission.pk)

    def update_visibility(self, mission_id, **data) -> Mission:
        mission = self.get(mission_id)
        if mission.status == MissionStatus.CLOSED:
            raise ValidationError("Closed missions cannot be updated.")
        if data.get("allow_volunteer_applications") and not data.get(
            "is_visible_to_volunteers", mission.is_visible_to_volunteers
        ):
            raise ValidationError(
                "Applications cannot be enabled while the mission is hidden from volunteers."
            )
        return self.repository.update(mission, **data)

    def publish(self, mission_id) -> Mission:
        return self._transition(mission_id, "publish")

    def start(self, mission_id) -> Mission:
        return self._transition(mission_id, "start")

    def complete(self, mission_id) -> Mission:
        return self._transition(mission_id, "complete")

    def close(self, mission_id) -> Mission:
        return self._transition(mission_id, "close")

    def reopen(self, mission_id) -> Mission:
        mission = self.get(mission_id)
        if mission.status != MissionStatus.CLOSED:
            raise ValidationError("Only closed missions can be reopened.")
        mission = self.repository.update(mission, status=MissionStatus.PUBLISHED)
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="mission",
            resource_id=mission.pk,
            metadata={"transition": "reopen", "status": MissionStatus.PUBLISHED},
        )
        return mission

    def resolve_coordinator(self, actor, coordinator_id=None):
        from accounts.models import User

        if coordinator_id is None:
            return actor

        if not self._user_roles(actor) & {"admin"}:
            raise ValidationError("Only admins can assign a coordinator to missions.")

        coordinator = User.objects.filter(pk=coordinator_id, is_active=True).first()
        if not coordinator:
            raise ValidationError("Selected coordinator was not found.")

        coordinator_roles = self._user_roles(coordinator)
        if not coordinator_roles & {"admin", "coordinator"}:
            raise ValidationError("Selected user must have coordinator or admin role.")

        return coordinator

    @transaction.atomic
    def apply(self, mission_id, user, message: str = "") -> MissionApplication:
        mission = self.get(mission_id)
        if mission.status != MissionStatus.PUBLISHED:
            raise ValidationError("Only published missions accept applications.")
        if not mission.is_visible_to_volunteers:
            raise ValidationError("This mission is not visible to volunteers.")
        if not mission.allow_volunteer_applications:
            raise ValidationError("This mission does not accept volunteer applications.")

        volunteer = VolunteerRepository().get_by_user_id(user.pk)
        if not volunteer:
            raise ValidationError("Volunteer profile is required to apply.")
        if not user.is_active:
            raise ValidationError("Inactive users cannot apply to missions.")

        existing_assignment = mission.assignments.filter(volunteer=volunteer).exists()
        if existing_assignment:
            raise ConflictError("You are already assigned to this mission.")

        existing_application = MissionApplication.all_objects.filter(
            mission=mission,
            volunteer=volunteer,
        ).first()
        if existing_application:
            if existing_application.deleted_at:
                existing_application.restore()
                existing_application.message = message
                existing_application.status = MissionApplicationStatus.SUBMITTED
                existing_application.reviewed_by = None
                existing_application.reviewed_at = None
                existing_application.review_note = ""
                existing_application.save()
                application = existing_application
            elif existing_application.status in _ACTIVE_APPLICATION_STATUSES:
                raise ConflictError("You have already applied to this mission.")
            else:
                existing_application.message = message
                existing_application.status = MissionApplicationStatus.SUBMITTED
                existing_application.reviewed_by = None
                existing_application.reviewed_at = None
                existing_application.review_note = ""
                existing_application.save()
                application = existing_application
        else:
            application = MissionApplication.objects.create(
                mission=mission,
                volunteer=volunteer,
                message=message,
            )

        AuditService().log(
            action=AuditAction.CREATE,
            resource_type="mission_application",
            resource_id=application.pk,
            user_id=user.pk,
            metadata={"mission_id": str(mission.pk)},
        )
        self._notify_mission_staff(
            mission,
            title="درخواست شرکت جدید",
            message=(
                f"داوطلب {application.volunteer.user.full_name} "
                f"برای مأموریت «{mission.title}» درخواست شرکت ثبت کرد."
            ),
            resource_id=application.pk,
        )
        self._notify_volunteer(
            application,
            title="ثبت درخواست مأموریت",
            message=(
                f"درخواست شما برای مأموریت «{mission.title}» ثبت شد و در انتظار بررسی است."
            ),
        )
        return application

    def list_applications(self, mission_id):
        mission = self.get(mission_id)
        return (
            MissionApplication.objects.filter(mission=mission)
            .select_related("volunteer__user", "reviewed_by")
            .order_by("-created_at")
        )

    def list_inbox_applications(self, user):
        qs = (
            MissionApplication.objects.filter(
                status__in=[
                    MissionApplicationStatus.SUBMITTED,
                    MissionApplicationStatus.WAITLIST,
                ]
            )
            .select_related("mission", "volunteer__user", "reviewed_by")
            .order_by("-created_at")
        )
        roles = self._user_roles(user)
        if "admin" in roles:
            return qs
        if "coordinator" in roles:
            return qs.filter(mission__coordinator=user)
        return MissionApplication.objects.none()

    def approve_application(self, application_id, reviewer, review_note: str = "") -> MissionApplication:
        from assignments.application.services.assignment_service import AssignmentService

        application = self._get_application(application_id)
        if application.status not in (
            MissionApplicationStatus.SUBMITTED,
            MissionApplicationStatus.WAITLIST,
        ):
            raise ValidationError("Only pending applications can be approved.")

        AssignmentService().assign(application.mission_id, application.volunteer_id)

        application.status = MissionApplicationStatus.APPROVED
        application.reviewed_by = reviewer
        application.reviewed_at = timezone.now()
        application.review_note = review_note
        application.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_note",
                "updated_at",
            ]
        )

        AuditService().log(
            action=AuditAction.APPROVE,
            resource_type="mission_application",
            resource_id=application.pk,
            user_id=reviewer.pk,
            metadata={"mission_id": str(application.mission_id)},
        )
        self._notify_volunteer(
            application,
            title="تأیید درخواست مأموریت",
            message=(
                f"درخواست شما برای مأموریت «{application.mission.title}» تأیید شد."
                + (f"\n\nیادداشت مدیر: {review_note}" if review_note else "")
            ),
        )
        return application

    def waitlist_application(self, application_id, reviewer, review_note: str = "") -> MissionApplication:
        application = self._get_application(application_id)
        if application.status != MissionApplicationStatus.SUBMITTED:
            raise ValidationError("Only submitted applications can be waitlisted.")

        application.status = MissionApplicationStatus.WAITLIST
        application.reviewed_by = reviewer
        application.reviewed_at = timezone.now()
        application.review_note = review_note
        application.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_note",
                "updated_at",
            ]
        )

        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="mission_application",
            resource_id=application.pk,
            user_id=reviewer.pk,
            metadata={"mission_id": str(application.mission_id), "decision": "waitlist"},
        )
        self._notify_volunteer(
            application,
            title="لیست انتظار مأموریت",
            message=(
                f"درخواست شما برای مأموریت «{application.mission.title}» در لیست انتظار قرار گرفت."
                + (f"\n\nیادداشت مدیر: {review_note}" if review_note else "")
            ),
        )
        return application

    def reject_application(self, application_id, reviewer, review_note: str = "") -> MissionApplication:
        application = self._get_application(application_id)
        if application.status not in (
            MissionApplicationStatus.SUBMITTED,
            MissionApplicationStatus.WAITLIST,
        ):
            raise ValidationError("Only pending applications can be rejected.")

        application.status = MissionApplicationStatus.REJECTED
        application.reviewed_by = reviewer
        application.reviewed_at = timezone.now()
        application.review_note = review_note
        application.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_note",
                "updated_at",
            ]
        )

        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="mission_application",
            resource_id=application.pk,
            user_id=reviewer.pk,
            metadata={"mission_id": str(application.mission_id), "decision": "rejected"},
        )
        message = f"درخواست شما برای مأموریت «{application.mission.title}» رد شد."
        if review_note:
            message += f"\n\nعلت: {review_note}"
        self._notify_volunteer(
            application,
            title="رد درخواست مأموریت",
            message=message,
        )
        return application

    def _notify_volunteer(self, application: MissionApplication, title: str, message: str) -> None:
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        NotificationDispatcher().notify_user(
            application.volunteer.user_id,
            title=title,
            message=message,
            resource_type="mission_application",
            resource_id=str(application.pk),
        )

    def _notify_coordinator_assignment(
        self,
        mission: Mission,
        coordinator,
        *,
        actor=None,
        previous_coordinator_id=None,
    ) -> None:
        """Notify the assigned coordinator when an admin (or another actor) assigns them."""
        if not coordinator:
            return

        coordinator_id = getattr(coordinator, "pk", coordinator)
        if not coordinator_id:
            return

        # No need to notify yourself when you create/keep the mission as yours.
        if actor is not None and str(getattr(actor, "pk", actor)) == str(coordinator_id):
            return

        # Skip if the coordinator did not change.
        if previous_coordinator_id is not None and str(previous_coordinator_id) == str(
            coordinator_id
        ):
            return

        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        actor_name = ""
        if actor is not None:
            actor_name = getattr(actor, "full_name", None) or getattr(actor, "email", "") or ""

        if previous_coordinator_id is None:
            title = "تخصیص مأموریت جدید"
            message = (
                f"مأموریت «{mission.title}» به شما به‌عنوان هماهنگ‌کننده اختصاص داده شد."
            )
        else:
            title = "تغییر هماهنگ‌کننده مأموریت"
            message = (
                f"هماهنگی مأموریت «{mission.title}» به شما واگذار شد."
            )

        if actor_name:
            message += f"\nتوسط: {actor_name}"

        NotificationDispatcher().notify_user(
            coordinator_id,
            title=title,
            message=message,
            resource_type="mission",
            resource_id=str(mission.pk),
        )

    def _notify_mission_staff(
        self,
        mission: Mission,
        title: str,
        message: str,
        resource_id,
    ) -> None:
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        NotificationDispatcher().notify_mission_staff(
            mission,
            title=title,
            message=message,
            resource_type="mission_application",
            resource_id=str(resource_id),
        )

    def _get_application(self, application_id) -> MissionApplication:
        application = (
            MissionApplication.objects.select_related("mission", "volunteer__user")
            .filter(pk=application_id)
            .first()
        )
        if not application:
            raise MissionNotFoundError()
        return application

    def _sync_required_skills(self, mission: Mission, skill_ids: list) -> None:
        valid_ids = list(
            Skill.objects.filter(id__in=skill_ids).values_list("id", flat=True)
        )
        if len(valid_ids) != len(set(skill_ids)):
            raise ValidationError("One or more selected skills are invalid.")

        MissionRequiredSkill.objects.filter(mission=mission).exclude(
            skill_id__in=valid_ids
        ).delete()

        for skill_id in valid_ids:
            existing = MissionRequiredSkill.all_objects.filter(
                mission=mission,
                skill_id=skill_id,
            ).first()
            if existing:
                if existing.deleted_at:
                    existing.restore()
            else:
                MissionRequiredSkill.objects.create(mission=mission, skill_id=skill_id)

    def _transition(self, mission_id, action: str) -> Mission:
        mission = self.get(mission_id)
        expected_from, target = self._TRANSITIONS[action]
        if mission.status != expected_from:
            raise ValidationError(
                f"Cannot {action} mission in '{mission.status}' status. Expected '{expected_from}'."
            )
        mission = self.repository.update(mission, status=target)
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="mission",
            resource_id=mission.pk,
            metadata={"transition": action, "status": target},
        )
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return mission

    def is_completed(self, mission_id) -> bool:
        mission = self.get(mission_id)
        return mission.status in (MissionStatus.COMPLETED, MissionStatus.CLOSED)
