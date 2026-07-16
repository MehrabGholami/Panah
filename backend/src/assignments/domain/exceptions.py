from common.exceptions.api_exceptions import NotFoundError


class AssignmentNotFoundError(NotFoundError):
    default_detail = "Assignment not found."
    default_code = "assignment_not_found"
