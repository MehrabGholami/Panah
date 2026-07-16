from __future__ import annotations

from common.services.base_service import BaseService
from disasters.domain.exceptions import DisasterNotFoundError
from disasters.infrastructure.repositories.disaster_repository import DisasterRepository
from disasters.models import Disaster


class DisasterService(BaseService):
    repository: DisasterRepository

    def __init__(self, repository: DisasterRepository | None = None):
        super().__init__(repository or DisasterRepository())

    def list(self):
        return self.repository.list().order_by("-created_at")

    def get(self, disaster_id) -> Disaster:
        disaster = self.repository.get_by_id(disaster_id)
        if not disaster:
            raise DisasterNotFoundError()
        return disaster

    def create(self, **data) -> Disaster:
        result = self.repository.create(**data)
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return result

    def update(self, disaster_id, **data) -> Disaster:
        disaster = self.get(disaster_id)
        result = self.repository.update(disaster, **data)
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
        return result

    def delete(self, disaster_id) -> None:
        disaster = self.get(disaster_id)
        self.repository.soft_delete(disaster)
        from dashboard.application.services.dashboard_service import DashboardService

        DashboardService.bump_cache_version()
