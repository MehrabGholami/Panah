from __future__ import annotations

from skills.data.default_skills import DEFAULT_SKILLS
from skills.models import Skill


def seed_default_skills() -> int:
    created_count = 0
    for name, category, description in DEFAULT_SKILLS:
        _, created = Skill.objects.get_or_create(
            name=name,
            defaults={"category": category, "description": description},
        )
        if created:
            created_count += 1
    return created_count
