from django.conf import settings
from django.db import models

from assignments.domain.enums import AssignmentTaskStatus
from assignments.models.assignment import Assignment
from common.models.base_model import BaseModel


class AssignmentTask(BaseModel):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=AssignmentTaskStatus.choices(),
        default=AssignmentTaskStatus.NOT_DONE,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_assignment_tasks",
    )
    status_updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "assignments_assignmenttask"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.title} ({self.assignment_id})"
