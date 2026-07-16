from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.filters import UserFilterSet
from accounts.api.serializers.user_serializers import (
    PermissionSerializer,
    RoleSerializer,
    UserAccessUpdateSerializer,
    UserRoleAssignSerializer,
    UserListSerializer,
)
from accounts.application.services.role_service import RoleService
from accounts.application.services.user_service import UserService
from accounts.models import Permission
from common.permissions.base import HasPermission


class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_any_permissions = ["accounts.manage_users", "accounts.view_users"]
    filterset_class = UserFilterSet
    ordering_fields = ["created_at", "email"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return UserService().list_users()


class UserRoleAssignView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "accounts.manage_roles"

    def patch(self, request, id):
        serializer = UserRoleAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService().assign_roles(id, serializer.validated_data["role_slugs"])
        return Response(UserListSerializer(user).data)


class UserAccessView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "accounts.manage_users"

    def patch(self, request, id):
        serializer = UserAccessUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService().set_access(
            id,
            is_active=serializer.validated_data["is_active"],
            actor=request.user,
        )
        return Response(UserListSerializer(user).data)


class RoleListCreateView(generics.ListCreateAPIView):
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "accounts.manage_roles"
    search_fields = ["name", "slug"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        return RoleService().list_roles()


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "accounts.manage_roles"
    lookup_field = "id"

    def get_queryset(self):
        return RoleService().list_roles()

    def perform_destroy(self, instance):
        RoleService().delete_role(instance.id)


class PermissionListView(generics.ListAPIView):
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "accounts.manage_roles"
    queryset = Permission.objects.all()
    search_fields = ["codename", "name"]
    ordering_fields = ["app_label", "codename"]
