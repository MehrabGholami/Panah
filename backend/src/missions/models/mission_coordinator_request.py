from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from missions.domain.enums import MissionCoordinatorRequestStatus
from missions.models.mission import Mission


class MissionCoordinatorRequest(BaseModel):
    """
    Formal request by a coordinator to own/coordinate a mission.

    Aligns with VOAD / ICS practice: mission ownership is accountable and
    changes only through an approved assignment queue (not informal claiming).
    """

    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="coordinator_requests",
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mission_coordinator_requests",
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=MissionCoordinatorRequestStatus.choices(),
        default=MissionCoordinatorRequestStatus.SUBMITTED,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_mission_coordinator_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True)

    class Meta:
        db_table = "missions_mission_coordinator_request"
        unique_together = ("mission", "requester")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.mission_id} <- coordinator:{self.requester_id} ({self.status})"
