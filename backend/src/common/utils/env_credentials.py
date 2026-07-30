"""Helpers for reading development-seed credentials from the environment.

Production must never rely on the built-in development fallbacks.
Seed commands and scripts must call these helpers instead of embedding
passwords in source code.
"""

from __future__ import annotations

import os


# Documented development-only fallbacks used when ADMIN_* are unset.
# They are intentionally weak and must be overridden before any non-local deploy.
_DEV_ADMIN_EMAIL = "Investicaco@gmail.com"
_DEV_ADMIN_PASSWORD = "ADMIN"
_DEV_SEED_PASSWORD = "SeedPass123!"


def get_admin_email() -> str:
    return os.environ.get("ADMIN_EMAIL", _DEV_ADMIN_EMAIL)


def get_admin_password() -> str:
    return os.environ.get("ADMIN_PASSWORD", _DEV_ADMIN_PASSWORD)


def get_seed_password() -> str:
    return os.environ.get("SEED_PASSWORD", _DEV_SEED_PASSWORD)
