from __future__ import annotations

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from common.exceptions.api_exceptions import ConflictError, PermissionDeniedError, ValidationError
from common.services.base_service import BaseService
from missions.domain.enums import (
    MissionApplicationStatus,
    MissionCoordinatorRequestStatus,
    MissionStatus,
)
from missions.domain.exceptions import MissionNotFoundError
from missions.infrastructure.repositories.mission_repository import MissionRepository
from missions.models import (
    Mission,
    MissionApplication,
    MissionCoordinatorRequest,
    MissionRequiredSkill,
)
from skills.models import Skill
from volunteers.infrastructure.repositories.volunteer_repository import VolunteerRepository

_ACTIVE_APPLICATION_STATUSES = (
    MissionApplicationStatus.SUBMITTED,
    MissionApplicationStatus.WAITLIST,
    MissionApplicationStatus.APPROVED,
)

_ACTIVE_COORDINATOR_REQUEST_STATUSES = (
    MissionCoordinatorRequestStatus.SUBMITTED,
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

    def _is_admin(self, user) -> bool:
        return "admin" in self._user_roles(user)

    def can_manage_mission(self, user, mission: Mission) -> bool:
        """
        Accountable ownership: only admin or the assigned coordinator may
        mutate mission lifecycle/visibility/settings.
        """
        if self._is_admin(user):
            return True
        roles = self._user_roles(user)
        if "coordinator" in roles and mission.coordinator_id == user.pk:
            return True
        return False

    def ensure_can_manage_mission(self, user, mission: Mission) -> None:
        if not self.can_manage_mission(user, mission):
            raise PermissionDeniedError(
                "Only the assigned coordinator or an admin can manage this mission."
            )

    def can_review_applications(self, user) -> bool:
        """Any admin/coordinator with staff role may review volunteer applications (UC-028/FR-038)."""
        return self._is_staff_role(user)

    def ensure_can_review_applications(self, user) -> None:
        if not self.can_review_applications(user):
            raise PermissionDeniedError(
                "Only coordinators and admins can review mission applications."
            )

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
        if actor is not None:
            self.ensure_can_manage_mission(actor, mission)
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
            # Manual reassignment supersedes open coordination requests.
            if previous_coordinator_id != mission.coordinator_id:
                self._reject_other_pending_coordinator_requests(
                    mission,
                    reviewer=actor,
                    keep_requester_id=None,
                    review_note="هماهنگ‌کننده توسط مدیر به‌صورت مستقیم تخصیص داده شد.",
                )
        return self.get(mission.pk)

    def update_visibility(self, mission_id, actor=None, **data) -> Mission:
        mission = self.get(mission_id)
        if actor is not None:
            self.ensure_can_manage_mission(actor, mission)
        if mission.status == MissionStatus.CLOSED:
            raise ValidationError("Closed missions cannot be updated.")
        if data.get("allow_volunteer_applications") and not data.get(
            "is_visible_to_volunteers", mission.is_visible_to_volunteers
        ):
            raise ValidationError(
                "Applications cannot be enabled while the mission is hidden from volunteers."
            )
        return self.repository.update(mission, **data)

    def publish(self, mission_id, actor=None) -> Mission:
        return self._transition(mission_id, "publish", actor=actor)

    def start(self, mission_id, actor=None) -> Mission:
        return self._transition(mission_id, "start", actor=actor)

    def complete(self, mission_id, actor=None) -> Mission:
        return self._transition(mission_id, "complete", actor=actor)

    def close(self, mission_id, actor=None) -> Mission:
        return self._transition(mission_id, "close", actor=actor)

    def reopen(self, mission_id, actor=None) -> Mission:
        mission = self.get(mission_id)
        if actor is not None:
            self.ensure_can_manage_mission(actor, mission)
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

        if not self._is_admin(actor):
            raise ValidationError("Only admins can assign a coordinator to missions.")

        coordinator = User.objects.filter(pk=coordinator_id, is_active=True).first()
        if not coordinator:
            raise ValidationError("Selected coordinator was not found.")

        coordinator_roles = self._user_roles(coordinator)
        if not coordinator_roles & {"admin", "coordinator"}:
            raise ValidationError("Selected user must have coordinator or admin role.")

        return coordinator

    def assign_coordinator(self, mission_id, actor, coordinator_id, review_note: str = "") -> Mission:
        """Admin-only explicit assignment of mission ownership."""
        if not self._is_admin(actor):
            raise PermissionDeniedError("Only admins can assign mission coordinators.")

        mission = self.get(mission_id)
        if mission.status == MissionStatus.CLOSED:
            raise ValidationError("Closed missions cannot change coordinator.")

        previous_coordinator_id = mission.coordinator_id
        coordinator = self.resolve_coordinator(actor, coordinator_id)
        mission = self.repository.update(mission, coordinator=coordinator)

        # Approve matching pending request if present; reject the rest.
        matching = (
            MissionCoordinatorRequest.objects.filter(
                mission=mission,
                requester=coordinator,
                status=MissionCoordinatorRequestStatus.SUBMITTED,
            )
            .first()
        )
        if matching:
            matching.status = MissionCoordinatorRequestStatus.APPROVED
            matching.reviewed_by = actor
            matching.reviewed_at = timezone.now()
            matching.review_note = review_note or "تخصیص مستقیم توسط مدیر"
            matching.save(
                update_fields=[
                    "status",
                    "reviewed_by",
                    "reviewed_at",
                    "review_note",
                    "updated_at",
                ]
            )

        self._reject_other_pending_coordinator_requests(
            mission,
            reviewer=actor,
            keep_requester_id=coordinator.pk,
            review_note=review_note
            or "هماهنگ‌کننده دیگری برای این مأموریت تخصیص داده شد.",
        )

        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="mission",
            resource_id=mission.pk,
            user_id=actor.pk,
            metadata={
                "action": "assign_coordinator",
                "coordinator_id": str(coordinator.pk),
                "previous_coordinator_id": str(previous_coordinator_id)
                if previous_coordinator_id
                else None,
            },
        )
        self._notify_coordinator_assignment(
            mission,
            coordinator,
            actor=actor,
            previous_coordinator_id=previous_coordinator_id,
        )
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return self.get(mission.pk)

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
        # UC-028 / FR-038: aggregated inbox of all missions for missions.create holders.
        if not self.can_review_applications(user):
            return MissionApplication.objects.none()
        return qs

    def approve_application(self, application_id, reviewer, review_note: str = "") -> MissionApplication:
        from assignments.application.services.assignment_service import AssignmentService

        application = self._get_application(application_id)
        self.ensure_can_review_applications(reviewer)
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
        self.ensure_can_review_applications(reviewer)
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
        self.ensure_can_review_applications(reviewer)
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

    @transaction.atomic
    def request_coordination(
        self, mission_id, user, message: str = ""
    ) -> MissionCoordinatorRequest:
        roles = self._user_roles(user)
        if "admin" in roles:
            raise PermissionDeniedError(
                "Admins assign coordinators directly and cannot request coordination."
            )
        if "coordinator" not in roles:
            raise PermissionDeniedError("Only coordinators can request mission coordination.")
        if not user.is_active:
            raise ValidationError("Inactive users cannot request coordination.")

        mission = self.get(mission_id)
        if mission.status == MissionStatus.CLOSED:
            raise ValidationError("Cannot request coordination on a closed mission.")
        if mission.coordinator_id == user.pk:
            raise ConflictError("You are already the coordinator of this mission.")

        existing = MissionCoordinatorRequest.all_objects.filter(
            mission=mission,
            requester=user,
        ).first()
        if existing:
            if existing.deleted_at:
                existing.restore()
            if existing.status in _ACTIVE_COORDINATOR_REQUEST_STATUSES:
                raise ConflictError("You already have a pending coordination request for this mission.")
            existing.message = message
            existing.status = MissionCoordinatorRequestStatus.SUBMITTED
            existing.reviewed_by = None
            existing.reviewed_at = None
            existing.review_note = ""
            existing.save(
                update_fields=[
                    "message",
                    "status",
                    "reviewed_by",
                    "reviewed_at",
                    "review_note",
                    "updated_at",
                ]
            )
            request_obj = existing
        else:
            request_obj = MissionCoordinatorRequest.objects.create(
                mission=mission,
                requester=user,
                message=message,
            )

        AuditService().log(
            action=AuditAction.CREATE,
            resource_type="mission_coordinator_request",
            resource_id=request_obj.pk,
            user_id=user.pk,
            metadata={"mission_id": str(mission.pk)},
        )
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        requester_name = getattr(user, "full_name", None) or user.email
        NotificationDispatcher().notify_admins(
            title="درخواست هماهنگی مأموریت",
            message=(
                f"{requester_name} برای هماهنگی مأموریت «{mission.title}» درخواست ثبت کرد."
            ),
            resource_type="mission_coordinator_request",
            resource_id=str(request_obj.pk),
            exclude_user_ids={user.pk},
        )
        return request_obj

    def list_coordinator_requests(self, mission_id):
        mission = self.get(mission_id)
        return (
            MissionCoordinatorRequest.objects.filter(mission=mission)
            .select_related("requester", "reviewed_by", "mission")
            .order_by("-created_at")
        )

    def list_inbox_coordinator_requests(self, user):
        if not self._is_admin(user):
            return MissionCoordinatorRequest.objects.none()
        return (
            MissionCoordinatorRequest.objects.filter(
                status=MissionCoordinatorRequestStatus.SUBMITTED,
            )
            .select_related("requester", "reviewed_by", "mission", "mission__disaster")
            .order_by("-created_at")
        )

    @transaction.atomic
    def approve_coordinator_request(
        self, request_id, reviewer, review_note: str = ""
    ) -> MissionCoordinatorRequest:
        if not self._is_admin(reviewer):
            raise PermissionDeniedError("Only admins can approve coordination requests.")

        request_obj = self._get_coordinator_request(request_id)
        if request_obj.status != MissionCoordinatorRequestStatus.SUBMITTED:
            raise ValidationError("Only pending coordination requests can be approved.")

        mission = request_obj.mission
        if mission.status == MissionStatus.CLOSED:
            raise ValidationError("Cannot assign coordinator on a closed mission.")

        previous_coordinator_id = mission.coordinator_id
        mission = self.repository.update(mission, coordinator=request_obj.requester)

        request_obj.status = MissionCoordinatorRequestStatus.APPROVED
        request_obj.reviewed_by = reviewer
        request_obj.reviewed_at = timezone.now()
        request_obj.review_note = review_note
        request_obj.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_note",
                "updated_at",
            ]
        )

        self._reject_other_pending_coordinator_requests(
            mission,
            reviewer=reviewer,
            keep_requester_id=request_obj.requester_id,
            review_note="درخواست هماهنگ‌کننده دیگری برای این مأموریت تأیید شد.",
        )

        AuditService().log(
            action=AuditAction.APPROVE,
            resource_type="mission_coordinator_request",
            resource_id=request_obj.pk,
            user_id=reviewer.pk,
            metadata={"mission_id": str(mission.pk)},
        )
        self._notify_coordinator_assignment(
            mission,
            request_obj.requester,
            actor=reviewer,
            previous_coordinator_id=previous_coordinator_id,
        )
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        NotificationDispatcher().notify_user(
            request_obj.requester_id,
            title="تأیید درخواست هماهنگی",
            message=(
                f"درخواست شما برای هماهنگی مأموریت «{mission.title}» تأیید شد."
                + (f"\n\nیادداشت مدیر: {review_note}" if review_note else "")
            ),
            resource_type="mission_coordinator_request",
            resource_id=str(request_obj.pk),
        )
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return request_obj

    @transaction.atomic
    def reject_coordinator_request(
        self, request_id, reviewer, review_note: str = ""
    ) -> MissionCoordinatorRequest:
        if not self._is_admin(reviewer):
            raise PermissionDeniedError("Only admins can reject coordination requests.")

        request_obj = self._get_coordinator_request(request_id)
        if request_obj.status != MissionCoordinatorRequestStatus.SUBMITTED:
            raise ValidationError("Only pending coordination requests can be rejected.")

        request_obj.status = MissionCoordinatorRequestStatus.REJECTED
        request_obj.reviewed_by = reviewer
        request_obj.reviewed_at = timezone.now()
        request_obj.review_note = review_note
        request_obj.save(
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
            resource_type="mission_coordinator_request",
            resource_id=request_obj.pk,
            user_id=reviewer.pk,
            metadata={
                "mission_id": str(request_obj.mission_id),
                "decision": "rejected",
            },
        )
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        message = (
            f"درخواست شما برای هماهنگی مأموریت «{request_obj.mission.title}» رد شد."
        )
        if review_note:
            message += f"\n\nعلت: {review_note}"
        NotificationDispatcher().notify_user(
            request_obj.requester_id,
            title="رد درخواست هماهنگی",
            message=message,
            resource_type="mission_coordinator_request",
            resource_id=str(request_obj.pk),
        )
        return request_obj

    def _reject_other_pending_coordinator_requests(
        self,
        mission: Mission,
        *,
        reviewer,
        keep_requester_id,
        review_note: str,
    ) -> None:
        qs = MissionCoordinatorRequest.objects.filter(
            mission=mission,
            status=MissionCoordinatorRequestStatus.SUBMITTED,
        )
        if keep_requester_id is not None:
            qs = qs.exclude(requester_id=keep_requester_id)
        now = timezone.now()
        for pending in qs:
            pending.status = MissionCoordinatorRequestStatus.REJECTED
            pending.reviewed_by = reviewer
            pending.reviewed_at = now
            pending.review_note = review_note
            pending.save(
                update_fields=[
                    "status",
                    "reviewed_by",
                    "reviewed_at",
                    "review_note",
                    "updated_at",
                ]
            )
            from notifications.application.services.notification_dispatcher import (
                NotificationDispatcher,
            )

            NotificationDispatcher().notify_user(
                pending.requester_id,
                title="رد درخواست هماهنگی",
                message=(
                    f"درخواست شما برای هماهنگی مأموریت «{mission.title}» رد شد."
                    f"\n\n{review_note}"
                ),
                resource_type="mission_coordinator_request",
                resource_id=str(pending.pk),
            )

    def _get_coordinator_request(self, request_id) -> MissionCoordinatorRequest:
        request_obj = (
            MissionCoordinatorRequest.objects.select_related(
                "mission", "requester", "reviewed_by"
            )
            .filter(pk=request_id)
            .first()
        )
        if not request_obj:
            raise MissionNotFoundError()
        return request_obj

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

    def _transition(self, mission_id, action: str, actor=None) -> Mission:
        mission = self.get(mission_id)
        if actor is not None:
            self.ensure_can_manage_mission(actor, mission)
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
