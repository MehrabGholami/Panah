from __future__ import annotations

from disasters.models import Disaster
from common.repositories.base_repository import BaseRepository


class DisasterRepository(BaseRepository[Disaster]):
    model = Disaster

    def count_active(self) -> int:
        from disasters.domain.enums import DisasterStatus

        return self.model.objects.filter(status=DisasterStatus.ACTIVE).count()
