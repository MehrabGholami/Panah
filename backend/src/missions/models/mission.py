from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from common.utils.location_display import format_location_display
from disasters.models import Disaster
from missions.domain.enums import MissionPriority, MissionStatus


class Mission(BaseModel):
    disaster = models.ForeignKey(
        Disaster,
        on_delete=models.CASCADE,
        related_name="missions",
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    coordinator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="coordinated_missions",
    )
    status = models.CharField(
        max_length=20,
        choices=MissionStatus.choices(),
        default=MissionStatus.DRAFT,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=MissionPriority.choices(),
        default=MissionPriority.MEDIUM,
        db_index=True,
    )
    province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_end_time_tba = models.BooleanField(default=False)
    required_volunteers = models.PositiveIntegerField(default=1)
    special_considerations = models.TextField(blank=True)
    equipment_needed = models.TextField(blank=True)
    safety_notes = models.TextField(blank=True)
    is_visible_to_volunteers = models.BooleanField(default=False)
    allow_volunteer_applications = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "missions_mission"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def location_display(self) -> str:
        return format_location_display(self.province, self.city, self.location)
