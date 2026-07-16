from common.exceptions.api_exceptions import ConflictError, NotFoundError


class UserNotFoundError(NotFoundError):
    default_detail = "User not found."
    default_code = "user_not_found"


class RoleNotFoundError(NotFoundError):
    default_detail = "Role not found."
    default_code = "role_not_found"


class DuplicateRoleError(ConflictError):
    default_detail = "Role already exists."
    default_code = "duplicate_role"
