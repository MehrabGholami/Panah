from django.conf import settings
from django.db import models

from common.models.base_model import BaseModel
from volunteers.domain.enums import VolunteerGender, VolunteerStatus


class VolunteerProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="volunteer_profile",
    )
    national_id = models.CharField(max_length=20, unique=True, db_index=True)
    city = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    gender = models.CharField(
        max_length=20,
        choices=VolunteerGender.choices(),
        default=VolunteerGender.UNSPECIFIED,
        db_index=True,
    )
    status = models.CharField(
        max_length=30,
        choices=VolunteerStatus.choices(),
        default=VolunteerStatus.ACTIVE,
        db_index=True,
    )
    availability = models.JSONField(default=dict, blank=True)
    custom_skills = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "volunteers_profile"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} ({self.status})"
