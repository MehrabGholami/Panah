from rest_framework import serializers

from skills.models import Skill, VolunteerSkill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "category", "description", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class VolunteerSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source="skill.name", read_only=True)
    skill_category = serializers.CharField(source="skill.category", read_only=True)

    class Meta:
        model = VolunteerSkill
        fields = (
            "id",
            "volunteer",
            "skill",
            "skill_name",
            "skill_category",
            "proficiency",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "skill_name", "skill_category")


class AssignSkillSerializer(serializers.Serializer):
    skill_id = serializers.UUIDField()
    proficiency = serializers.IntegerField(min_value=1, max_value=5)
