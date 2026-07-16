from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

from authentication.domain.exceptions import TokenBlacklistedError
from authentication.infrastructure.token_blacklist import TokenBlacklistService


class RedisJWTAuthentication(JWTAuthentication):
    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        jti = validated.get("jti")
        if jti and TokenBlacklistService().is_blacklisted(jti, str(raw_token)):
            raise InvalidToken(TokenBlacklistedError.default_detail)
        return validated

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user is not None and not user.is_active:
            raise InvalidToken("User account is disabled.")
        return user
