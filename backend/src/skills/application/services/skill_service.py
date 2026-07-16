from __future__ import annotations

from common.exceptions.api_exceptions import ConflictError, ValidationError
from common.services.base_service import BaseService
from skills.domain.exceptions import SkillNotFoundError
from skills.infrastructure.repositories.skill_repository import SkillRepository, VolunteerSkillRepository
from skills.models import Skill, VolunteerSkill


class SkillService(BaseService):
    repository: SkillRepository

    def __init__(
        self,
        repository: SkillRepository | None = None,
        volunteer_skill_repository: VolunteerSkillRepository | None = None,
    ):
        super().__init__(repository or SkillRepository())
        self.volunteer_skill_repository = volunteer_skill_repository or VolunteerSkillRepository()

    def list(self):
        return self.repository.list().order_by("category", "name")

    def get(self, skill_id) -> Skill:
        skill = self.repository.get_by_id(skill_id)
        if not skill:
            raise SkillNotFoundError()
        return skill

    def create(self, **data) -> Skill:
        if self.repository.exists(name=data.get("name", "")):
            raise ConflictError("A skill with this name already exists.")
        return self.repository.create(**data)

    def update(self, skill_id, **data) -> Skill:
        skill = self.get(skill_id)
        name = data.get("name")
        if name and name != skill.name and self.repository.exists(name=name):
            raise ConflictError("A skill with this name already exists.")
        return self.repository.update(skill, **data)

    def delete(self, skill_id) -> None:
        skill = self.get(skill_id)
        self.repository.soft_delete(skill)

    def assign_to_volunteer(self, volunteer_id, skill_id, proficiency: int) -> VolunteerSkill:
        if not 1 <= proficiency <= 5:
            raise ValidationError("Proficiency must be between 1 and 5.")

        self.get(skill_id)
        existing = self.volunteer_skill_repository.get_by_volunteer_and_skill(volunteer_id, skill_id)
        if existing:
            return self.volunteer_skill_repository.update(existing, proficiency=proficiency)

        return self.volunteer_skill_repository.create(
            volunteer_id=volunteer_id,
            skill_id=skill_id,
            proficiency=proficiency,
        )

    def list_volunteer_skills(self, volunteer_id):
        return self.volunteer_skill_repository.list_for_volunteer(volunteer_id)
