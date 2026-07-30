from django.urls import path

from assignments.api.views.assignment_views import (
    AssignmentAcceptView,
    AssignmentCheckInView,
    AssignmentCompleteView,
    AssignmentDeclineView,
    AssignmentDetailView,
    AssignmentListCreateView,
    AssignmentMyListView,
    AssignmentTaskDetailView,
    AssignmentTaskListCreateView,
    AssignmentTaskStatusView,
)

urlpatterns = [
    path("my/", AssignmentMyListView.as_view(), name="assignment-my-list"),
    path("tasks/<uuid:task_id>/status/", AssignmentTaskStatusView.as_view(), name="assignment-task-status"),
    path("tasks/<uuid:task_id>/", AssignmentTaskDetailView.as_view(), name="assignment-task-detail"),
    path("", AssignmentListCreateView.as_view(), name="assignment-list-create"),
    path("<uuid:id>/", AssignmentDetailView.as_view(), name="assignment-detail"),
    path("<uuid:id>/accept/", AssignmentAcceptView.as_view(), name="assignment-accept"),
    path("<uuid:id>/decline/", AssignmentDeclineView.as_view(), name="assignment-decline"),
    path("<uuid:id>/check-in/", AssignmentCheckInView.as_view(), name="assignment-check-in"),
    path("<uuid:id>/complete/", AssignmentCompleteView.as_view(), name="assignment-complete"),
    path("<uuid:id>/tasks/", AssignmentTaskListCreateView.as_view(), name="assignment-task-list-create"),
]
