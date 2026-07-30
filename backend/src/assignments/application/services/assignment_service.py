from __future__ import annotations

from typing import TYPE_CHECKING

from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from common.exceptions.api_exceptions import ConflictError, ValidationError
from common.services.base_service import BaseService
from assignments.domain.enums import AssignmentStatus
from assignments.domain.exceptions import AssignmentNotFoundError
from assignments.infrastructure.repositories.assignment_repository import AssignmentRepository
from assignments.models import Assignment
from volunteers.infrastructure.repositories.volunteer_repository import VolunteerRepository

if TYPE_CHECKING:
    from missions.application.services.mission_service import MissionService


class AssignmentService(BaseService):
    repository: AssignmentRepository

    _TRANSITIONS = {
        "accept": (AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED),
        "decline": (AssignmentStatus.PENDING, AssignmentStatus.DECLINED),
        "check_in": (AssignmentStatus.ACCEPTED, AssignmentStatus.CHECKED_IN),
        "complete": (AssignmentStatus.CHECKED_IN, AssignmentStatus.COMPLETED),
    }

    def __init__(
        self,
        repository: AssignmentRepository | None = None,
        volunteer_repository: VolunteerRepository | None = None,
        mission_service: "MissionService | None" = None,
    ):
        super().__init__(repository or AssignmentRepository())
        self.volunteer_repository = volunteer_repository or VolunteerRepository()
        self._mission_service = mission_service

    @property
    def mission_service(self) -> "MissionService":
        if self._mission_service is None:
            from missions.application.services.mission_service import MissionService

            self._mission_service = MissionService()
        return self._mission_service

    def list(self):
        from assignments.application.services.assignment_task_service import (
            AssignmentTaskService,
        )

        return AssignmentTaskService.annotate_assignments(
            self.repository.list_with_relations()
        )

    def list_for_user(self, user):
        from assignments.application.services.assignment_task_service import (
            AssignmentTaskService,
        )

        volunteer = self.volunteer_repository.get_by_user_id(user.pk)
        if not volunteer:
            return self.repository.list_with_relations().none()
        return AssignmentTaskService.annotate_assignments(
            self.repository.list_for_volunteer(volunteer.pk)
        )

    def get(self, assignment_id) -> Assignment:
        assignment = self.list().filter(pk=assignment_id).first()
        if not assignment:
            raise AssignmentNotFoundError()
        return assignment

    def assign(self, mission_id, volunteer_id) -> Assignment:
        volunteer = self.volunteer_repository.get_by_id(volunteer_id)
        if not volunteer:
            from volunteers.domain.exceptions import VolunteerNotFoundError

            raise VolunteerNotFoundError()
        if not volunteer.user.is_active:
            raise ValidationError("Inactive users cannot be assigned to missions.")

        self.mission_service.get(mission_id)

        if self.repository.get_by_mission_and_volunteer(mission_id, volunteer_id):
            raise ConflictError("Volunteer is already assigned to this mission.")

        assignment = self.repository.create(
            mission_id=mission_id,
            volunteer_id=volunteer_id,
            status=AssignmentStatus.PENDING,
        )
        AuditService().log(
            action=AuditAction.ASSIGN,
            resource_type="assignment",
            resource_id=assignment.pk,
            metadata={"mission_id": str(mission_id), "volunteer_id": str(volunteer_id)},
        )
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        mission = self.mission_service.get(mission_id)
        NotificationDispatcher().notify_user(
            volunteer.user_id,
            title="تخصیص مأموریت جدید",
            message=f"شما به مأموریت «{mission.title}» تخصیص داده شدید. وضعیت را در مأموریت‌های من بررسی کنید.",
            resource_type="assignment",
            resource_id=str(assignment.pk),
        )
        return assignment

    def accept(self, assignment_id) -> Assignment:
        return self._transition(assignment_id, "accept")

    def decline(self, assignment_id) -> Assignment:
        return self._transition(assignment_id, "decline")

    def check_in(self, assignment_id) -> Assignment:
        return self._transition(assignment_id, "check_in")

    def complete(self, assignment_id) -> Assignment:
        return self._transition(assignment_id, "complete")

    def _transition(self, assignment_id, action: str) -> Assignment:
        assignment = self.get(assignment_id)
        expected_from, target = self._TRANSITIONS[action]

        if assignment.status == target:
            return assignment

        if assignment.status != expected_from:
            raise ValidationError(
                f"Cannot {action.replace('_', ' ')} assignment in '{assignment.status}' status."
            )

        updated = self.repository.update(assignment, status=target)
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="assignment",
            resource_id=updated.pk,
            metadata={"action": action, "status": target},
        )

        if action in {"accept", "decline"}:
            from notifications.application.services.notification_dispatcher import (
                NotificationDispatcher,
            )

            volunteer_user = updated.volunteer.user
            volunteer_name = (
                f"{volunteer_user.first_name} {volunteer_user.last_name}".strip()
                or volunteer_user.email
            )
            mission = updated.mission
            if action == "accept":
                title = "پذیرش تخصیص مأموریت"
                message = f"داوطلب «{volunteer_name}» تخصیص مأموریت «{mission.title}» را پذیرفت."
            else:
                title = "رد تخصیص مأموریت"
                message = f"داوطلب «{volunteer_name}» تخصیص مأموریت «{mission.title}» را رد کرد."
            NotificationDispatcher().notify_mission_staff(
                mission,
                title=title,
                message=message,
                resource_type="assignment",
                resource_id=str(updated.pk),
            )
        return updated
