from rest_framework import serializers

from accounts.models import Permission, Role, User


class UserListSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    national_id = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "national_id",
            "city",
            "skills",
            "is_approved",
            "is_active",
            "roles",
            "created_at",
        )
        read_only_fields = fields

    def get_roles(self, obj):
        return [ur.role.slug for ur in obj.user_roles.select_related("role").all()]

    def get_national_id(self, obj):
        volunteer_profile = getattr(obj, "volunteer_profile", None)
        if not volunteer_profile:
            return None
        return volunteer_profile.national_id

    def get_city(self, obj):
        volunteer_profile = getattr(obj, "volunteer_profile", None)
        if not volunteer_profile:
            return ""
        return volunteer_profile.city or ""

    def get_skills(self, obj):
        volunteer_profile = getattr(obj, "volunteer_profile", None)
        if not volunteer_profile:
            return []
        names = []
        for volunteer_skill in volunteer_profile.volunteer_skills.all():
            skill = getattr(volunteer_skill, "skill", None)
            if skill and skill.name:
                names.append(skill.name)
        return names


class UserRoleAssignSerializer(serializers.Serializer):
    role_slugs = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=False,
    )

    def validate_role_slugs(self, value):
        cleaned = []
        for slug in value:
            normalized = slug.strip()
            if normalized and normalized not in cleaned:
                cleaned.append(normalized)
        if not cleaned:
            raise serializers.ValidationError("At least one role is required.")
        if len(cleaned) > 1:
            raise serializers.ValidationError("Each user can only have one role.")
        return cleaned


class UserAccessUpdateSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "codename", "name", "app_label", "description")
        read_only_fields = fields


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    permission_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = Role
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "is_system",
            "permissions",
            "permission_ids",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_system", "permissions", "created_at", "updated_at")

    def get_permissions(self, obj):
        perms = [
            rp.permission
            for rp in obj.role_permissions.select_related("permission").all()
            if rp.permission
        ]
        return PermissionSerializer(perms, many=True).data

    def create(self, validated_data):
        permission_ids = validated_data.pop("permission_ids", None)
        from accounts.application.services.role_service import RoleService

        return RoleService().create_role(permission_ids=permission_ids, **validated_data)

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop("permission_ids", None)
        from accounts.application.services.role_service import RoleService

        return RoleService().update_role(instance.id, permission_ids=permission_ids, **validated_data)
