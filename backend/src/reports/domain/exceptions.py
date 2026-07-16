from common.exceptions.api_exceptions import NotFoundError


class ReportNotFoundError(NotFoundError):
    default_detail = "Report not found."
    default_code = "report_not_found"
