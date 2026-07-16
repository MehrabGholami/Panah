from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from accounts.models import UserProfile

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return User.objects.normalize_email(value.strip())


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            "education",
            "occupation",
            "interests",
            "address",
            "blood_type",
            "languages",
            "years_of_experience",
            "date_of_birth",
            "emergency_contact_name",
            "emergency_contact_phone",
            "medical_conditions",
            "disability",
        )


class VolunteerProfileMeSerializer(serializers.Serializer):
    national_id = serializers.CharField(read_only=True)
    city = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(read_only=True)


class ProfileUpdateSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(max_length=255, required=False, allow_blank=True)
    occupation = serializers.CharField(max_length=150, required=False, allow_blank=True)
    interests = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    blood_type = serializers.CharField(max_length=10, required=False, allow_blank=True)
    languages = serializers.CharField(max_length=255, required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    emergency_contact_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    emergency_contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    medical_conditions = serializers.CharField(required=False, allow_blank=True)
    disability = serializers.CharField(required=False, allow_blank=True)


class UserMeSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    volunteer_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "is_approved",
            "is_staff",
            "avatar",
            "profile",
            "volunteer_profile",
            "roles",
            "permissions",
        )
        read_only_fields = fields

    def get_roles(self, obj):
        return [ur.role.slug for ur in obj.user_roles.select_related("role").all()]

    def get_permissions(self, obj):
        from accounts.application.services.permission_service import PermissionService

        return sorted(PermissionService().get_user_permissions(obj))

    def get_avatar(self, obj):
        from authentication.application.services.profile_service import ProfileService

        request = self.context.get("request")
        return ProfileService().get_avatar_url(obj, request=request)

    def get_profile(self, obj):
        try:
            return UserProfileSerializer(obj.profile).data
        except UserProfile.DoesNotExist:
            return None

    def get_volunteer_profile(self, obj):
        volunteer_profile = getattr(obj, "volunteer_profile", None)
        if volunteer_profile is None:
            return None
        return VolunteerProfileMeSerializer(volunteer_profile).data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


from rest_framework_simplejwt.exceptions import InvalidToken

from authentication.infrastructure.token_blacklist import TokenBlacklistService


class AuthTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = attrs["refresh"]
        from rest_framework_simplejwt.tokens import RefreshToken

        try:
            token = RefreshToken(refresh)
            if TokenBlacklistService().is_blacklisted(token["jti"], refresh):
                raise InvalidToken("Token has been revoked.")
        except Exception:
            pass
        return super().validate(attrs)
