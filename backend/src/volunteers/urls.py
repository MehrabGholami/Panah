from django.urls import path

from volunteers.api.views.volunteer_views import (
    VolunteerApproveView,
    VolunteerDetailView,
    VolunteerListView,
    VolunteerRegisterView,
    VolunteerRejectView,
)

urlpatterns = [
    path("register/", VolunteerRegisterView.as_view(), name="volunteer-register"),
    path("", VolunteerListView.as_view(), name="volunteer-list"),
    path("<uuid:id>/", VolunteerDetailView.as_view(), name="volunteer-detail"),
    path("<uuid:id>/approve/", VolunteerApproveView.as_view(), name="volunteer-approve"),
    path("<uuid:id>/reject/", VolunteerRejectView.as_view(), name="volunteer-reject"),
]
