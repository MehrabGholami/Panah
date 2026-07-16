from __future__ import annotations

import mimetypes
import os

from django.db import transaction

from accounts.models import User, UserProfile
from common.exceptions.api_exceptions import PermissionDeniedError, ValidationError

ALLOWED_AVATAR_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/x-png",
}
ALLOWED_AVATAR_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024


class ProfileService:
    USER_FIELDS = ("phone", "first_name", "last_name")
    PROFILE_FIELDS = (
        "education",
        "occupation",
        "interests",
        "address",
        "blood_type",
        "languages",
        "years_of_experience",
        "date_of_birth",
        "emergency_contact_name",
        "emergency_contact_phone",
        "medical_conditions",
        "disability",
    )
    VOLUNTEER_FIELDS = ("city", "bio")

    def get_user_with_profile(self, user: User) -> User:
        return (
            User.objects.select_related("profile")
            .prefetch_related("user_roles__role", "volunteer_profile")
            .get(pk=user.pk)
        )

    @transaction.atomic
    def update_profile(self, user: User, **data) -> User:
        user_updates = {k: data[k] for k in self.USER_FIELDS if k in data}
        profile_updates = {k: data[k] for k in self.PROFILE_FIELDS if k in data}
        volunteer_updates = {k: data[k] for k in self.VOLUNTEER_FIELDS if k in data}

        if user_updates:
            for field, value in user_updates.items():
                setattr(user, field, value)
            user.save(update_fields=[*user_updates.keys(), "updated_at"])

        if profile_updates:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            for field, value in profile_updates.items():
                setattr(profile, field, value)
            profile.save()

        if volunteer_updates:
            volunteer_profile = getattr(user, "volunteer_profile", None)
            if volunteer_profile is None:
                raise ValidationError("Volunteer profile not found for this user.")
            for field, value in volunteer_updates.items():
                setattr(volunteer_profile, field, value)
            volunteer_profile.save()

        return self.get_user_with_profile(user)

    def upload_avatar(self, user: User, file) -> User:
        if not file:
            raise ValidationError("File is required.")

        content_type = getattr(file, "content_type", "") or mimetypes.guess_type(file.name)[0] or ""
        extension = os.path.splitext(file.name)[1].lower()

        if content_type not in ALLOWED_AVATAR_TYPES and extension not in ALLOWED_AVATAR_EXTENSIONS:
            raise ValidationError("Only JPEG, PNG, and WebP images are allowed.")

        if file.size > MAX_AVATAR_SIZE_BYTES:
            raise ValidationError("Image size must be less than 3 MB.")

        if user.avatar:
            user.avatar.delete(save=False)

        user.avatar = file
        user.save(update_fields=["avatar", "updated_at"])
        return self.get_user_with_profile(user)

    def get_avatar_url(self, user: User, request=None) -> str | None:
        if not user.avatar:
            return None
        url = user.avatar.url
        if not url.startswith("/"):
            url = f"/{url.lstrip('/')}"
        return url

    def can_view_avatar(self, viewer: User, target: User) -> bool:
        if viewer.pk == target.pk:
            return True
        if viewer.is_superuser:
            return True
        roles = list(
            viewer.user_roles.select_related("role").values_list("role__slug", flat=True)
        )
        return "admin" in roles

    def get_user_avatar_for_viewer(self, viewer: User, target: User, request=None) -> str | None:
        if not self.can_view_avatar(viewer, target):
            raise PermissionDeniedError("You cannot view this user's avatar.")
        return self.get_avatar_url(target, request=request)
