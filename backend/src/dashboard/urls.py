from django.urls import path

from dashboard.api.views.dashboard_views import DashboardStatsView

urlpatterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
