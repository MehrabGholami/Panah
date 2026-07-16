from django.urls import path

from skills.api.views.skill_views import (
    PublicSkillListView,
    SkillDetailView,
    SkillListCreateView,
    VolunteerSkillAssignView,
    VolunteerSkillListView,
)

urlpatterns = [
    path("public/", PublicSkillListView.as_view(), name="skill-public-list"),
    path("", SkillListCreateView.as_view(), name="skill-list-create"),
    path("<uuid:id>/", SkillDetailView.as_view(), name="skill-detail"),
    path(
        "volunteers/<uuid:volunteer_id>/",
        VolunteerSkillListView.as_view(),
        name="volunteer-skill-list",
    ),
    path(
        "volunteers/<uuid:volunteer_id>/assign/",
        VolunteerSkillAssignView.as_view(),
        name="volunteer-skill-assign",
    ),
]
