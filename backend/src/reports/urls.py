from django.urls import path

from reports.api.views.report_views import (
    FinishedMissionDetailView,
    FinishedMissionListView,
    ReportAttachmentView,
    ReportDetailView,
    ReportListCreateView,
    ReportReviewView,
    ReportSubmitView,
)

urlpatterns = [
    path("", ReportListCreateView.as_view(), name="report-list-create"),
    path("finished-missions/", FinishedMissionListView.as_view(), name="finished-mission-list"),
    path(
        "finished-missions/<uuid:id>/",
        FinishedMissionDetailView.as_view(),
        name="finished-mission-detail",
    ),
    path("<uuid:id>/", ReportDetailView.as_view(), name="report-detail"),
    path("<uuid:id>/submit/", ReportSubmitView.as_view(), name="report-submit"),
    path("<uuid:id>/review/", ReportReviewView.as_view(), name="report-review"),
    path("<uuid:id>/attachments/", ReportAttachmentView.as_view(), name="report-attachment"),
]
