from common.exceptions.api_exceptions import NotFoundError


class AssignmentNotFoundError(NotFoundError):
    default_detail = "Assignment not found."
    default_code = "assignment_not_found"


class AssignmentTaskNotFoundError(NotFoundError):
    default_detail = "Assignment task not found."
    default_code = "assignment_task_not_found"
