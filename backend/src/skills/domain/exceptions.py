from common.exceptions.api_exceptions import NotFoundError


class SkillNotFoundError(NotFoundError):
    default_detail = "Skill not found."
    default_code = "skill_not_found"
