from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from missions.domain.enums import MissionApplicationStatus
from missions.models.mission import Mission
from volunteers.models import VolunteerProfile


class MissionApplication(BaseModel):
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    volunteer = models.ForeignKey(
        VolunteerProfile,
        on_delete=models.CASCADE,
        related_name="mission_applications",
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=MissionApplicationStatus.choices(),
        default=MissionApplicationStatus.SUBMITTED,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_mission_applications",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True)

    class Meta:
        db_table = "missions_mission_application"
        unique_together = ("mission", "volunteer")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.mission.title} <- {self.volunteer_id}"
