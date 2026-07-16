from django.db import models

from common.models.base_model import BaseModel
from reports.models.mission_report import MissionReport


def report_attachment_path(instance, filename):
    return f"reports/{instance.report_id}/{filename}"


class ReportAttachment(BaseModel):
    report = models.ForeignKey(
        MissionReport,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to=report_attachment_path)

    class Meta:
        db_table = "reports_attachment"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Attachment for report {self.report_id}"
