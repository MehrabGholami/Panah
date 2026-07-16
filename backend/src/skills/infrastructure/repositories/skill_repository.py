from __future__ import annotations

from skills.models import Skill, VolunteerSkill
from common.repositories.base_repository import BaseRepository


class SkillRepository(BaseRepository[Skill]):
    model = Skill


class VolunteerSkillRepository(BaseRepository[VolunteerSkill]):
    model = VolunteerSkill

    def get_by_volunteer_and_skill(self, volunteer_id, skill_id):
        return self.model.objects.filter(volunteer_id=volunteer_id, skill_id=skill_id).first()

    def list_for_volunteer(self, volunteer_id):
        return self.model.objects.filter(volunteer_id=volunteer_id).select_related("skill")
