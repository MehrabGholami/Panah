from common.exceptions.api_exceptions import APIException


class AuditLogError(APIException):
    status_code = 500
    default_detail = "Failed to record audit log."
    default_code = "audit_log_error"
