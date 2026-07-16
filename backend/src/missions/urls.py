from django.urls import path

from missions.api.views.mission_views import (
    MissionApplicationApproveView,
    MissionApplicationInboxView,
    MissionApplicationListView,
    MissionApplicationRejectView,
    MissionApplicationWaitlistView,
    MissionApplyView,
    MissionCloseView,
    MissionCompleteView,
    MissionDetailView,
    MissionListCreateView,
    MissionPublishView,
    MissionReopenView,
    MissionStartView,
    MissionVisibilityView,
)

urlpatterns = [
    path("", MissionListCreateView.as_view(), name="mission-list-create"),
    path(
        "applications/inbox/",
        MissionApplicationInboxView.as_view(),
        name="mission-applications-inbox",
    ),
    path("<uuid:id>/", MissionDetailView.as_view(), name="mission-detail"),
    path("<uuid:id>/publish/", MissionPublishView.as_view(), name="mission-publish"),
    path("<uuid:id>/start/", MissionStartView.as_view(), name="mission-start"),
    path("<uuid:id>/complete/", MissionCompleteView.as_view(), name="mission-complete"),
    path("<uuid:id>/close/", MissionCloseView.as_view(), name="mission-close"),
    path("<uuid:id>/reopen/", MissionReopenView.as_view(), name="mission-reopen"),
    path("<uuid:id>/visibility/", MissionVisibilityView.as_view(), name="mission-visibility"),
    path("<uuid:id>/apply/", MissionApplyView.as_view(), name="mission-apply"),
    path(
        "<uuid:id>/applications/",
        MissionApplicationListView.as_view(),
        name="mission-applications",
    ),
    path(
        "<uuid:id>/applications/<uuid:application_id>/approve/",
        MissionApplicationApproveView.as_view(),
        name="mission-application-approve",
    ),
    path(
        "<uuid:id>/applications/<uuid:application_id>/reject/",
        MissionApplicationRejectView.as_view(),
        name="mission-application-reject",
    ),
    path(
        "<uuid:id>/applications/<uuid:application_id>/waitlist/",
        MissionApplicationWaitlistView.as_view(),
        name="mission-application-waitlist",
    ),
]
