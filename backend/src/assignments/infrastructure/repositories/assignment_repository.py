from __future__ import annotations

from assignments.models import Assignment
from common.repositories.base_repository import BaseRepository


class AssignmentRepository(BaseRepository[Assignment]):
    model = Assignment

    def get_by_mission_and_volunteer(self, mission_id, volunteer_id):
        return self.model.objects.filter(mission_id=mission_id, volunteer_id=volunteer_id).first()

    def list_with_relations(self):
        return self.model.objects.select_related(
            "mission", "volunteer", "volunteer__user"
        ).order_by("-created_at")

    def list_for_volunteer(self, volunteer_id):
        return self.list_with_relations().filter(volunteer_id=volunteer_id)
