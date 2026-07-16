from django.urls import path

from accounts.api.views.user_views import (
    PermissionListView,
    RoleDetailView,
    RoleListCreateView,
    UserAccessView,
    UserRoleAssignView,
    UserListView,
)

urlpatterns = [
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<uuid:id>/roles/", UserRoleAssignView.as_view(), name="user-role-assign"),
    path("users/<uuid:id>/access/", UserAccessView.as_view(), name="user-access"),
    path("roles/", RoleListCreateView.as_view(), name="role-list-create"),
    path("roles/<uuid:id>/", RoleDetailView.as_view(), name="role-detail"),
    path("permissions/", PermissionListView.as_view(), name="permission-list"),
]
