from common.exceptions.api_exceptions import NotFoundError


class MissionNotFoundError(NotFoundError):
    default_detail = "Mission not found."
    default_code = "mission_not_found"
