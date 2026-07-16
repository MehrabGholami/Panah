from __future__ import annotations

from reports.models import MissionReport, ReportAttachment
from common.repositories.base_repository import BaseRepository


class ReportRepository(BaseRepository[MissionReport]):
    model = MissionReport

    def list_with_relations(self):
        return self.model.objects.select_related("mission", "author").prefetch_related(
            "attachments"
        ).order_by("-created_at")


class ReportAttachmentRepository(BaseRepository[ReportAttachment]):
    model = ReportAttachment
