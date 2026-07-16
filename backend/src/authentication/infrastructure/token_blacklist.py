from __future__ import annotations

import hashlib

from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken


class TokenBlacklistService:
    @staticmethod
    def _token_key(jti: str) -> str:
        return f"{settings.JWT_BLACKLIST_CACHE_PREFIX}:{jti}"

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def blacklist_token(self, token_str: str, jti: str, expires_in: int | None = None) -> None:
        ttl = expires_in or settings.JWT_BLACKLIST_CACHE_TTL
        cache.set(self._token_key(jti), self._hash_token(token_str), timeout=ttl)

    def is_blacklisted(self, jti: str, token_str: str | None = None) -> bool:
        stored = cache.get(self._token_key(jti))
        if stored is None:
            return False
        if token_str is None:
            return True
        return stored == self._hash_token(token_str)

    def blacklist_refresh_token(self, refresh_token: RefreshToken) -> None:
        access = refresh_token.access_token
        self.blacklist_token(
            str(access),
            access["jti"],
            int(access.lifetime.total_seconds()),
        )
        self.blacklist_token(
            str(refresh_token),
            refresh_token["jti"],
            int(refresh_token.lifetime.total_seconds()),
        )
        refresh_token.blacklist()
