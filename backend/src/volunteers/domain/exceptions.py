from common.exceptions.api_exceptions import NotFoundError


class VolunteerNotFoundError(NotFoundError):
    default_detail = "Volunteer not found."
    default_code = "volunteer_not_found"
