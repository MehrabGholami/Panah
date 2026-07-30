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
    "reject": "رد",
}

RESOURCE_LABELS_FA = {
    "user": "کاربر",
    "disaster": "بحران",
    "mission": "مأموریت",
    "mission_application": "درخواست مأموریت",
    "mission_coordinator_request": "درخواست هماهنگی مأموریت",
    "volunteer": "داوطلب",
    "ticket": "تیکت",
    "report": "گزارش",
    "assignment": "تکلیف",
    "notification": "اعلان",
    "role": "نقش",
    "permission": "دسترسی",
    "backup_run": "بکاپ",
}

MISSION_TRANSITION_LABELS_FA = {
    "publish": "انتشار مأموریت",
    "start": "شروع مأموریت",
    "complete": "تکمیل مأموریت",
    "close": "بستن مأموریت",
    "reopen": "بازگشایی مأموریت",
}

APPLICATION_DECISION_LABELS_FA = {
    "waitlist": "قرار دادن درخواست مأموریت در لیست انتظار",
    "rejected": "رد درخواست مأموریت",
    "reject": "رد درخواست مأموریت",
    "approved": "تأیید درخواست مأموریت",
    "approve": "تأیید درخواست مأموریت",
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

    if resource_type == "backup_run":
        phase = metadata.get("phase")
        if phase == "started":
            return "شروع بکاپ"
        if phase == "success":
            return "بکاپ موفق"
        if phase == "failed":
            return "شکست بکاپ"

    if resource_type == "mission_application":
        decision = metadata.get("decision") or metadata.get("action")
        if decision in APPLICATION_DECISION_LABELS_FA:
            return APPLICATION_DECISION_LABELS_FA[decision]
        if action == "approve":
            return "تأیید درخواست مأموریت"
        if action == "create":
            return "ثبت درخواست مأموریت"

    transition = metadata.get("transition")
    if transition and resource_type == "mission":
        if transition in MISSION_TRANSITION_LABELS_FA:
            return MISSION_TRANSITION_LABELS_FA[transition]

    title = metadata.get("title") or metadata.get("resource_title")
    action_label = ACTION_LABELS_FA.get(action, action)
    resource_label = RESOURCE_LABELS_FA.get(resource_type, resource_type)

    if title:
        return f"{action_label} — {title}"
    if action_label and resource_label:
        return f"{action_label} {resource_label}"
    return action_label or resource_label or "—"
