from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from missions.models import Mission
from reports.domain.enums import ReportStatus


class MissionReport(BaseModel):
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="mission_reports",
    )
    content = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices(),
        default=ReportStatus.DRAFT,
        db_index=True,
    )

    class Meta:
        db_table = "reports_mission_report"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report for {self.mission.title} ({self.status})"
