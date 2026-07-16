import logging

from rest_framework.views import exception_handler

from common.exceptions.api_exceptions import APIException

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        payload = {
            "success": False,
            "error": {
                "code": getattr(exc, "default_code", "error"),
                "message": response.data.get("detail", str(exc)),
                "details": response.data if isinstance(response.data, dict) else {"detail": response.data},
            },
        }
        if isinstance(exc, APIException):
            payload["error"]["code"] = exc.default_code
            payload["error"]["message"] = str(exc.detail)
            if exc.extra:
                payload["error"]["details"] = exc.extra
        response.data = payload
        return response

    if isinstance(exc, Exception):
        logger.exception("Unhandled exception", exc_info=exc)
        from rest_framework.response import Response
        from rest_framework import status

        return Response(
            {
                "success": False,
                "error": {
                    "code": "internal_error",
                    "message": "An unexpected error occurred.",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
