from rest_framework import serializers

from volunteers.models import VolunteerProfile


class VolunteerRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    national_id = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    availability = serializers.JSONField(required=False, default=dict)
    skill_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
    )
    custom_skill_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
    )

    def _clean_skill_names(self, value: list[str]) -> list[str]:
        cleaned: list[str] = []
        for name in value:
            normalized = name.strip()
            if normalized and normalized not in cleaned:
                cleaned.append(normalized)
        return cleaned

    def validate_skill_names(self, value):
        from skills.models import Skill

        cleaned = self._clean_skill_names(value)
        if not cleaned:
            return []

        existing_names = set(
            Skill.objects.filter(name__in=cleaned).values_list("name", flat=True)
        )
        if len(existing_names) != len(cleaned):
            raise serializers.ValidationError("One or more selected skills are invalid.")
        return cleaned

    def validate_custom_skill_names(self, value):
        cleaned = self._clean_skill_names(value)
        if any(len(name) < 2 for name in cleaned):
            raise serializers.ValidationError("Each custom skill must be at least 2 characters.")
        return cleaned

    def validate(self, attrs):
        skill_names = attrs.get("skill_names") or []
        custom_skill_names = attrs.get("custom_skill_names") or []
        if not skill_names and not custom_skill_names:
            raise serializers.ValidationError("At least one skill is required.")
        return attrs


class VolunteerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    avatar = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    education = serializers.SerializerMethodField()
    occupation = serializers.SerializerMethodField()
    interests = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    blood_type = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    years_of_experience = serializers.SerializerMethodField()
    date_of_birth = serializers.SerializerMethodField()
    emergency_contact_name = serializers.SerializerMethodField()
    emergency_contact_phone = serializers.SerializerMethodField()
    medical_conditions = serializers.SerializerMethodField()
    disability = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerProfile
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "avatar",
            "national_id",
            "city",
            "bio",
            "status",
            "availability",
            "custom_skills",
            "skills",
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
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def _profile(self, obj):
        return getattr(obj.user, "profile", None)

    def get_avatar(self, obj):
        from authentication.application.services.profile_service import ProfileService

        request = self.context.get("request")
        return ProfileService().get_avatar_url(obj.user, request=request)

    def get_skills(self, obj):
        return [
            {
                "name": volunteer_skill.skill.name,
                "category": volunteer_skill.skill.category,
                "proficiency": volunteer_skill.proficiency,
            }
            for volunteer_skill in obj.volunteer_skills.select_related("skill").all()
        ]

    def get_education(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "education", "") or ""

    def get_occupation(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "occupation", "") or ""

    def get_interests(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "interests", "") or ""

    def get_address(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "address", "") or ""

    def get_blood_type(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "blood_type", "") or ""

    def get_languages(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "languages", "") or ""

    def get_years_of_experience(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "years_of_experience", None)

    def get_date_of_birth(self, obj):
        profile = self._profile(obj)
        value = getattr(profile, "date_of_birth", None)
        return value.isoformat() if value else None

    def get_emergency_contact_name(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "emergency_contact_name", "") or ""

    def get_emergency_contact_phone(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "emergency_contact_phone", "") or ""

    def get_medical_conditions(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "medical_conditions", "") or ""

    def get_disability(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "disability", "") or ""
