from rest_framework.exceptions import APIException as DRFAPIException


class APIException(DRFAPIException):
    def __init__(self, detail=None, code=None, extra=None):
        super().__init__(detail=detail, code=code)
        self.extra = extra or {}


class NotFoundError(APIException):
    status_code = 404
    default_detail = "Resource not found."
    default_code = "not_found"


class ValidationError(APIException):
    status_code = 400
    default_detail = "Validation failed."
    default_code = "validation_error"


class PermissionDeniedError(APIException):
    status_code = 403
    default_detail = "Permission denied."
    default_code = "permission_denied"


class ConflictError(APIException):
    status_code = 409
    default_detail = "Resource conflict."
    default_code = "conflict"
