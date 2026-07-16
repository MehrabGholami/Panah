from common.exceptions.api_exceptions import NotFoundError


class DisasterNotFoundError(NotFoundError):
    default_detail = "Disaster not found."
    default_code = "disaster_not_found"
