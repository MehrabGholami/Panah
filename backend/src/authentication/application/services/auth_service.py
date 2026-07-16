from __future__ import annotations

from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from django.contrib.auth import authenticate

from accounts.infrastructure.repositories.user_repository import UserRepository
from authentication.domain.exceptions import InvalidCredentialsError
from authentication.infrastructure.token_blacklist import TokenBlacklistService
from common.services.base_service import BaseService
from rest_framework_simplejwt.tokens import RefreshToken


class AuthService(BaseService):
    def __init__(
        self,
        user_repository: UserRepository | None = None,
        blacklist_service: TokenBlacklistService | None = None,
    ):
        self.user_repository = user_repository or UserRepository()
        self.blacklist_service = blacklist_service or TokenBlacklistService()

    def login(self, email: str, password: str) -> dict:
        user = authenticate(email=email, password=password)
        if user is None:
            user = self.user_repository.get_by_email(email)
            if user is None or not user.check_password(password):
                raise InvalidCredentialsError()
        if not user.is_active:
            raise InvalidCredentialsError("Account is inactive.")
        refresh = RefreshToken.for_user(user)
        AuditService().log(
            action=AuditAction.LOGIN,
            resource_type="user",
            resource_id=user.pk,
            user_id=user.pk,
        )
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user,
        }

    def logout(self, refresh_token_str: str, user=None) -> None:
        token = RefreshToken(refresh_token_str)
        self.blacklist_service.blacklist_refresh_token(token)
        AuditService().log(
            action=AuditAction.LOGOUT,
            resource_type="user",
            resource_id=getattr(user, "pk", None) or "",
            user_id=getattr(user, "pk", None),
        )

    def get_current_user(self, user):
        return user
