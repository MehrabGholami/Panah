from __future__ import annotations

from audit_logs.models import AuditLog

ACTION_LABELS_FA = {
    "create": "ایجاد",
    "update": "ویرایش",
    "delete": "حذف",
    "login": "ورود",
    "logout": "خروج",
    "view": "مشاهده",
    "approve": "تأیید",
    "assign": "تخصیص",
}

RESOURCE_LABELS_FA = {
    "user": "کاربر",
    "disaster": "بحران",
    "mission": "مأموریت",
    "volunteer": "داوطلب",
    "ticket": "تیکت",
    "report": "گزارش",
    "assignment": "تکلیف",
    "notification": "اعلان",
}


def build_audit_change_summary(log: AuditLog) -> str:
    action = log.action or ""
    resource_type = log.resource_type or ""
    metadata = log.metadata or {}

    if action == "login" and resource_type == "user":
        return "ورود به سامانه"
    if action == "logout" and resource_type == "user":
        return "خروج از سامانه"

    access_change = metadata.get("access_change")
    if resource_type == "user" and access_change == "blocked":
        target = metadata.get("target_email") or metadata.get("target_name")
        return f"منع ورود کاربر{' ' + str(target) if target else ''}".strip()
    if resource_type == "user" and access_change == "unblocked":
        target = metadata.get("target_email") or metadata.get("target_name")
        return f"فعال‌سازی ورود کاربر{' ' + str(target) if target else ''}".strip()

    if metadata.get("action") == "reject" and resource_type == "volunteer":
        return "رد درخواست داوطلب"

    transition = metadata.get("transition")
    if transition and resource_type == "mission":
        transition_labels = {
            "publish": "انتشار مأموریت",
            "start": "شروع مأموریت",
            "complete": "تکمیل مأموریت",
            "close": "بستن مأموریت",
        }
        if transition in transition_labels:
            return transition_labels[transition]

    title = metadata.get("title") or metadata.get("resource_title")
    action_label = ACTION_LABELS_FA.get(action, action)
    resource_label = RESOURCE_LABELS_FA.get(resource_type, resource_type)

    if title:
        return f"{action_label} — {title}"
    if action_label and resource_label:
        return f"{action_label} {resource_label}"
    return action_label or resource_label or "—"
