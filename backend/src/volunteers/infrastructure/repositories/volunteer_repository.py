from __future__ import annotations

from volunteers.models import VolunteerProfile
from common.repositories.base_repository import BaseRepository


class VolunteerRepository(BaseRepository[VolunteerProfile]):
    model = VolunteerProfile

    def get_by_user_id(self, user_id):
        return self.model.objects.filter(user_id=user_id).first()

    def get_by_national_id(self, national_id: str):
        return self.model.objects.filter(national_id=national_id).first()

    def list_with_user(self):
        return (
            self.model.objects.select_related("user", "user__profile")
            .prefetch_related("volunteer_skills__skill")
            .order_by("-created_at")
        )

    def get_by_id(self, pk):
        return (
            self.model.objects.select_related("user", "user__profile")
            .prefetch_related("volunteer_skills__skill")
            .filter(pk=pk)
            .first()
        )

    def count_by_status(self, status: str) -> int:
        return self.model.objects.filter(status=status).count()
