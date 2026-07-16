from django.urls import path

from disasters.api.views.disaster_views import DisasterDetailView, DisasterListCreateView

urlpatterns = [
    path("", DisasterListCreateView.as_view(), name="disaster-list-create"),
    path("<uuid:id>/", DisasterDetailView.as_view(), name="disaster-detail"),
]
