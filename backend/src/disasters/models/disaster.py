from django.db import models

from common.models.base_model import BaseModel
from common.utils.location_display import format_location_display
from disasters.domain.enums import DisasterSeverity, DisasterStatus, DisasterType


class Disaster(BaseModel):
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    disaster_type = models.CharField(
        max_length=30,
        choices=DisasterType.choices(),
        default=DisasterType.OTHER,
        db_index=True,
    )
    severity = models.CharField(
        max_length=20,
        choices=DisasterSeverity.choices(),
        default=DisasterSeverity.MEDIUM,
        db_index=True,
    )
    province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255, blank=True)
    occurred_at = models.DateTimeField(null=True, blank=True, db_index=True)
    needs = models.JSONField(default=list, blank=True)
    affected_population = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=DisasterStatus.choices(),
        default=DisasterStatus.ACTIVE,
        db_index=True,
    )
    metadata = models.JSONField(default=dict, blank=True)
    class Meta:
        db_table = "disasters_disaster"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def location_display(self) -> str:
        return format_location_display(self.province, self.city, self.location)
