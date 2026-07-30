from __future__ import annotations

from django.db.models import Count
from django.utils import timezone

from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from assignments.domain.enums import AssignmentStatus, AssignmentTaskStatus
from assignments.domain.exceptions import AssignmentNotFoundError, AssignmentTaskNotFoundError
from assignments.models import Assignment, AssignmentTask
from common.exceptions.api_exceptions import PermissionDeniedError, ValidationError

TASKABLE_ASSIGNMENT_STATUSES = {
    AssignmentStatus.ACCEPTED,
    AssignmentStatus.CHECKED_IN,
}


class AssignmentTaskService:
    def _user_roles(self, user) -> set[str]:
        return set(user.user_roles.values_list("role__slug", flat=True))

    def _get_assignment(self, assignment_id) -> Assignment:
        assignment = (
            Assignment.objects.select_related("mission", "volunteer", "volunteer__user")
            .filter(pk=assignment_id)
            .first()
        )
        if not assignment:
            raise AssignmentNotFoundError()
        return assignment

    def _get_task(self, task_id) -> AssignmentTask:
        task = (
            AssignmentTask.objects.select_related(
                "assignment",
                "assignment__mission",
                "assignment__volunteer",
                "assignment__volunteer__user",
                "created_by",
            )
            .filter(pk=task_id)
            .first()
        )
        if not task:
            raise AssignmentTaskNotFoundError()
        return task

    def _ensure_taskable(self, assignment: Assignment) -> None:
        if assignment.status not in TASKABLE_ASSIGNMENT_STATUSES:
            raise ValidationError(
                "Tasks can only be managed after the volunteer has accepted the assignment."
            )

    def _ensure_mission_coordinator(self, user, assignment: Assignment) -> None:
        roles = self._user_roles(user)
        if "admin" in roles:
            raise PermissionDeniedError(
                "Only the mission coordinator can manage volunteer tasks."
            )
        if "coordinator" not in roles:
            raise PermissionDeniedError(
                "Only the mission coordinator can manage volunteer tasks."
            )
        if assignment.mission.coordinator_id != user.pk:
            raise PermissionDeniedError(
                "Only the assigned mission coordinator can manage volunteer tasks."
            )

    def _ensure_can_view(self, user, assignment: Assignment) -> None:
        roles = self._user_roles(user)
        if assignment.volunteer.user_id == user.pk:
            return
        if "admin" in roles:
            return
        if "coordinator" in roles and assignment.mission.coordinator_id == user.pk:
            return
        raise PermissionDeniedError("You do not have access to these tasks.")

    def _ensure_assignment_volunteer(self, user, assignment: Assignment) -> None:
        if assignment.volunteer.user_id != user.pk:
            raise PermissionDeniedError("Only the assigned volunteer can report task status.")

    def list_for_assignment(self, assignment_id, user):
        assignment = self._get_assignment(assignment_id)
        self._ensure_can_view(user, assignment)
        return AssignmentTask.objects.filter(assignment_id=assignment_id).select_related(
            "created_by", "assignment"
        )

    def create(self, assignment_id, user, title: str, description: str = "") -> AssignmentTask:
        assignment = self._get_assignment(assignment_id)
        self._ensure_mission_coordinator(user, assignment)
        self._ensure_taskable(assignment)

        title = (title or "").strip()
        if not title:
            raise ValidationError("Task title is required.")

        task = AssignmentTask.objects.create(
            assignment=assignment,
            title=title,
            description=(description or "").strip(),
            status=AssignmentTaskStatus.NOT_DONE,
            created_by=user,
        )
        AuditService().log(
            action=AuditAction.CREATE,
            resource_type="assignment_task",
            resource_id=task.pk,
            metadata={"assignment_id": str(assignment.pk), "title": task.title},
        )
        return task

    def update(self, task_id, user, *, title: str | None = None, description: str | None = None) -> AssignmentTask:
        task = self._get_task(task_id)
        self._ensure_mission_coordinator(user, task.assignment)
        self._ensure_taskable(task.assignment)

        updates = {}
        if title is not None:
            cleaned = title.strip()
            if not cleaned:
                raise ValidationError("Task title is required.")
            updates["title"] = cleaned
        if description is not None:
            updates["description"] = description.strip()

        if not updates:
            return task

        for field, value in updates.items():
            setattr(task, field, value)
        task.save(update_fields=[*updates.keys(), "updated_at"])
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="assignment_task",
            resource_id=task.pk,
            metadata={"fields": list(updates.keys())},
        )
        return task

    def delete(self, task_id, user) -> None:
        task = self._get_task(task_id)
        self._ensure_mission_coordinator(user, task.assignment)
        self._ensure_taskable(task.assignment)
        task_pk = task.pk
        task.soft_delete()
        AuditService().log(
            action=AuditAction.DELETE,
            resource_type="assignment_task",
            resource_id=task_pk,
            metadata={"assignment_id": str(task.assignment_id)},
        )

    def report_status(self, task_id, user, status: str) -> AssignmentTask:
        task = self._get_task(task_id)
        self._ensure_assignment_volunteer(user, task.assignment)
        self._ensure_taskable(task.assignment)

        valid = {s.value for s in AssignmentTaskStatus}
        if status not in valid:
            raise ValidationError(f"Invalid task status. Allowed: {', '.join(sorted(valid))}.")

        if task.status == status:
            return task

        task.status = status
        task.status_updated_at = timezone.now()
        task.save(update_fields=["status", "status_updated_at", "updated_at"])
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="assignment_task",
            resource_id=task.pk,
            metadata={"action": "report_status", "status": status},
        )
        return task

    @staticmethod
    def annotate_assignments(queryset):
        return queryset.annotate(tasks_count=Count("tasks"))
