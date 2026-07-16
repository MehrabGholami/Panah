import logging
import time

logger = logging.getLogger("django.request")


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        duration_ms = (time.perf_counter() - start) * 1000

        if not request.path.startswith(("/health/", "/static/", "/media/")):
            logger.info(
                "%s %s status=%s duration_ms=%.2f user=%s",
                request.method,
                request.path,
                response.status_code,
                duration_ms,
                getattr(request.user, "pk", None),
                extra={"correlation_id": getattr(request, "correlation_id", "-")},
            )
        return response
