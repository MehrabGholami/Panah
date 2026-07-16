from __future__ import annotations

from audit_logs.application.services.audit_service import AuditService
from audit_logs.domain.enums import AuditAction
from common.exceptions.api_exceptions import ValidationError
from common.services.base_service import BaseService
from missions.application.services.mission_service import MissionService
from missions.domain.enums import MissionStatus
from reports.domain.enums import ReportStatus
from reports.domain.exceptions import ReportNotFoundError
from reports.infrastructure.repositories.report_repository import (
    ReportAttachmentRepository,
    ReportRepository,
)
from reports.models import MissionReport


class ReportService(BaseService):
    repository: ReportRepository

    def __init__(
        self,
        repository: ReportRepository | None = None,
        attachment_repository: ReportAttachmentRepository | None = None,
        mission_service: MissionService | None = None,
    ):
        super().__init__(repository or ReportRepository())
        self.attachment_repository = attachment_repository or ReportAttachmentRepository()
        self.mission_service = mission_service or MissionService()

    def list(self):
        return self.repository.list_with_relations()

    def get(self, report_id) -> MissionReport:
        report = self.repository.get_by_id(report_id)
        if not report:
            raise ReportNotFoundError()
        return report

    def create(self, author_id, **data) -> MissionReport:
        mission = data.get("mission")
        mission_id = mission.pk if hasattr(mission, "pk") else data.get("mission_id")
        self.mission_service.get(mission_id)
        return self.repository.create(author_id=author_id, **data)

    def update(self, report_id, **data) -> MissionReport:
        report = self.get(report_id)
        if report.status != ReportStatus.DRAFT:
            raise ValidationError("Only draft reports can be updated.")
        data.pop("status", None)
        return self.repository.update(report, **data)

    def submit(self, report_id) -> MissionReport:
        report = self.get(report_id)
        if report.status == ReportStatus.SUBMITTED:
            return report
        if report.status != ReportStatus.DRAFT:
            raise ValidationError("Only draft reports can be submitted.")

        mission = self.mission_service.get(report.mission_id)
        if mission.status not in (MissionStatus.COMPLETED, MissionStatus.CLOSED):
            raise ValidationError("Reports can only be submitted after the mission is completed.")

        report = self.repository.update(report, status=ReportStatus.SUBMITTED)
        AuditService().log(
            action=AuditAction.UPDATE,
            resource_type="report",
            resource_id=report.pk,
            metadata={"action": "submit"},
        )
        return report

    def review(self, report_id) -> MissionReport:
        report = self.get(report_id)
        if report.status != ReportStatus.SUBMITTED:
            raise ValidationError("Only submitted reports can be reviewed.")
        return self.repository.update(report, status=ReportStatus.REVIEWED)

    def add_attachment(self, report_id, file) -> MissionReport:
        report = self.get(report_id)
        if report.status != ReportStatus.DRAFT:
            raise ValidationError("Attachments can only be added to draft reports.")
        self.attachment_repository.create(report=report, file=file)
        return report
