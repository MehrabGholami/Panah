from django.db import models

from common.models.base_model import BaseModel
from skills.models.skill import Skill
from volunteers.models import VolunteerProfile


class VolunteerSkill(BaseModel):
    volunteer = models.ForeignKey(
        VolunteerProfile,
        on_delete=models.CASCADE,
        related_name="volunteer_skills",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="volunteer_skills",
    )
    proficiency = models.PositiveSmallIntegerField()

    class Meta:
        db_table = "skills_volunteer_skill"
        unique_together = ("volunteer", "skill")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.volunteer_id} -> {self.skill.name} ({self.proficiency})"
