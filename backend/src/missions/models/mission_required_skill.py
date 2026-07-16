from django.db import models

from common.models.base_model import BaseModel
from missions.models.mission import Mission
from skills.models import Skill


class MissionRequiredSkill(BaseModel):
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="required_skills",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="mission_requirements",
    )
    is_required = models.BooleanField(default=True)

    class Meta:
        db_table = "missions_mission_required_skill"
        unique_together = ("mission", "skill")
        ordering = ["skill__category", "skill__name"]

    def __str__(self):
        return f"{self.mission.title} -> {self.skill.name}"
