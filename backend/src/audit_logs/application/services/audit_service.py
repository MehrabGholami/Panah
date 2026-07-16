from __future__ import annotations

import logging
from contextlib import contextmanager
from contextvars import ContextVar

from audit_logs.models import AuditLog


logger = logging.getLogger("audit")

_audit_context: ContextVar[dict] = ContextVar("audit_context", default={})


class AuditService:
    @staticmethod
    @contextmanager
    def bind_context(**context):
        token = _audit_context.set({**_audit_context.get(), **context})
        try:
            yield
        finally:
            _audit_context.reset(token)

    @staticmethod
    def get_context() -> dict:
        return _audit_context.get()

    def log(
        self,
        action: str,
        resource_type: str,
        resource_id: str = "",
        metadata: dict | None = None,
        user_id=None,
    ) -> AuditLog:
        ctx = self.get_context()
        entry = AuditLog.objects.create(
            user_id=user_id or ctx.get("user_id"),
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else "",
            ip_address=ctx.get("ip_address"),
            user_agent=ctx.get("user_agent", ""),
            correlation_id=ctx.get("correlation_id", ""),
            metadata=metadata or {},
        )
        logger.info(
            "audit action=%s resource=%s:%s user=%s",
            action,
            resource_type,
            resource_id,
            entry.user_id,
            extra={"correlation_id": entry.correlation_id},
        )
        return entry
