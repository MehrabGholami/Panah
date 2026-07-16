from __future__ import annotations

from django.db import transaction

from accounts.domain.enums import SystemRole
from accounts.infrastructure.repositories.user_repository import RoleRepository, UserRepository
from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from common.exceptions.api_exceptions import ConflictError, ValidationError
from common.services.base_service import BaseService
from volunteers.domain.enums import VolunteerStatus
from volunteers.domain.exceptions import VolunteerNotFoundError
from volunteers.infrastructure.repositories.volunteer_repository import VolunteerRepository
from volunteers.models import VolunteerProfile
from skills.application.services.skill_service import SkillService
from skills.models import Skill


class VolunteerService(BaseService):
    repository: VolunteerRepository

    def __init__(self, repository: VolunteerRepository | None = None):
        super().__init__(repository or VolunteerRepository())

    def register(self, **data) -> VolunteerProfile:
        email = data.pop("email")
        password = data.pop("password")
        national_id = data.get("national_id")
        skill_names: list[str] = data.pop("skill_names", []) or []
        custom_skill_names: list[str] = data.pop("custom_skill_names", []) or []

        if not skill_names and not custom_skill_names:
            raise ValidationError("At least one skill is required.")

        if self.repository.get_by_national_id(national_id):
            raise ConflictError("A volunteer with this national ID already exists.")

        user_repo = UserRepository()
        if user_repo.get_by_email(email):
            raise ConflictError("A user with this email already exists.")

        with transaction.atomic():
            user = user_repo.create(
                email=email,
                first_name=data.pop("first_name", ""),
                last_name=data.pop("last_name", ""),
                phone=data.pop("phone", ""),
                is_active=True,
                is_approved=True,
            )
            user.set_password(password)
            user.save(update_fields=["password"])

            volunteer_role = RoleRepository().get_by_slug(SystemRole.VOLUNTEER.value)
            if volunteer_role:
                user_repo.assign_role(user, volunteer_role)

            profile = self.repository.create(
                user=user,
                status=VolunteerStatus.ACTIVE,
                custom_skills=custom_skill_names,
                **data,
            )

            if skill_names:
                skills = list(Skill.objects.filter(name__in=skill_names))
                found_names = {skill.name for skill in skills}
                missing = [name for name in skill_names if name not in found_names]
                if missing:
                    raise ValidationError("One or more selected skills are invalid.")

                skill_service = SkillService()
                for skill in skills:
                    skill_service.assign_to_volunteer(
                        volunteer_id=profile.pk,
                        skill_id=skill.pk,
                        proficiency=3,
                    )

        AuditService().log(
            action=AuditAction.CREATE,
            resource_type="volunteer",
            resource_id=profile.pk,
            user_id=user.pk,
        )
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        dispatcher = NotificationDispatcher()
        display_name = f"{user.first_name} {user.last_name}".strip() or user.email
        dispatcher.notify_user(
            user.pk,
            title="خوش آمدید به پناه",
            message="ثبت‌نام شما با موفقیت انجام شد. می‌توانید مأموریت‌های موجود را مشاهده و درخواست دهید.",
            resource_type="volunteer",
            resource_id=str(profile.pk),
        )
        dispatcher.notify_admins(
            title="داوطلب جدید",
            message=f"داوطلب «{display_name}» در سامانه ثبت‌نام کرد.",
            resource_type="volunteer",
            resource_id=str(profile.pk),
            exclude_user_ids={str(user.pk)},
        )
        return profile

    def approve(self, volunteer_id) -> VolunteerProfile:
        profile = self.get(volunteer_id)
        if profile.status not in (VolunteerStatus.PENDING_APPROVAL, VolunteerStatus.REGISTERED):
            raise ValidationError("Only pending volunteers can be approved.")

        profile = self.repository.update(
            profile,
            status=VolunteerStatus.ACTIVE,
        )
        user = profile.user
        user.is_approved = True
        user.save(update_fields=["is_approved", "updated_at"])

        AuditService().log(
            action=AuditAction.APPROVE,
            resource_type="volunteer",
            resource_id=profile.pk,
        )
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        NotificationDispatcher().notify_user(
            user.pk,
            title="فعال‌سازی حساب داوطلبی",
            message="حساب داوطلبی شما تأیید و فعال شد.",
            resource_type="volunteer",
            resource_id=str(profile.pk),
        )
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return profile

    def reject(self, volunteer_id, reason: str = "") -> VolunteerProfile:
        profile = self.get(volunteer_id)
        if profile.status not in (VolunteerStatus.PENDING_APPROVAL, VolunteerStatus.REGISTERED):
            raise ValidationError("Only pending volunteers can be rejected.")

        profile = self.repository.update(
            profile,
            status=VolunteerStatus.REJECTED,
        )
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="volunteer",
            resource_id=profile.pk,
            metadata={"action": "reject", "reason": reason},
        )
        from notifications.application.services.notification_dispatcher import NotificationDispatcher

        message = "درخواست عضویت داوطلبی شما رد شد."
        if reason:
            message += f"\n\nعلت: {reason}"
        NotificationDispatcher().notify_user(
            profile.user_id,
            title="رد درخواست عضویت",
            message=message,
            resource_type="volunteer",
            resource_id=str(profile.pk),
        )
        return profile

    def list(self):
        return self.repository.list_with_user()

    def get(self, volunteer_id) -> VolunteerProfile:
        profile = self.repository.get_by_id(volunteer_id)
        if not profile:
            raise VolunteerNotFoundError()
        return profile

    def get_by_user_id(self, user_id) -> VolunteerProfile | None:
        return self.repository.get_by_user_id(user_id)
