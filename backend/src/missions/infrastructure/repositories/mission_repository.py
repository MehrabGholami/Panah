from __future__ import annotations

from django.db.models import Count, Q

from missions.models import Mission
from common.repositories.base_repository import BaseRepository


class MissionRepository(BaseRepository[Mission]):
    model = Mission

    def list_with_relations(self):
        from missions.domain.enums import MissionApplicationStatus

        return (
            self.model.objects.select_related("disaster", "coordinator")
            .prefetch_related("required_skills__skill")
            .annotate(
                applications_count=Count("applications", distinct=True),
                pending_applications_count=Count(
                    "applications",
                    filter=Q(applications__status=MissionApplicationStatus.SUBMITTED),
                    distinct=True,
                ),
                assignments_count=Count("assignments", distinct=True),
            )
            .order_by("-created_at")
        )

    def count_in_progress(self) -> int:
        from missions.domain.enums import MissionStatus

        return self.model.objects.filter(status=MissionStatus.IN_PROGRESS).count()

    def get_by_id_with_relations(self, mission_id):
        from missions.domain.enums import MissionApplicationStatus

        return (
            self.model.objects.select_related("disaster", "coordinator")
            .prefetch_related("required_skills__skill")
            .annotate(
                applications_count=Count("applications", distinct=True),
                pending_applications_count=Count(
                    "applications",
                    filter=Q(applications__status=MissionApplicationStatus.SUBMITTED),
                    distinct=True,
                ),
                assignments_count=Count("assignments", distinct=True),
            )
            .filter(pk=mission_id)
            .first()
        )
