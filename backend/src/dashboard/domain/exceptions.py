from common.exceptions.api_exceptions import APIException


class DashboardError(APIException):
    default_detail = "Dashboard data unavailable."
    default_code = "dashboard_error"
