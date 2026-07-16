from django.db import models

from assignments.domain.enums import AssignmentStatus
from common.models.base_model import BaseModel
from missions.models import Mission
from volunteers.models import VolunteerProfile


class Assignment(BaseModel):
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    volunteer = models.ForeignKey(
        VolunteerProfile,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    status = models.CharField(
        max_length=20,
        choices=AssignmentStatus.choices(),
        default=AssignmentStatus.PENDING,
        db_index=True,
    )

    class Meta:
        db_table = "assignments_assignment"
        unique_together = ("mission", "volunteer")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.mission.title} -> {self.volunteer_id}"
