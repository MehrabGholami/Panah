from rest_framework import serializers

from disasters.domain.enums import DisasterSeverity, DisasterType
from disasters.models import Disaster

ALLOWED_NEED_KEYS = {
    "rescue",
    "medical",
    "food",
    "water",
    "shelter",
    "clothing",
    "transport",
    "volunteers",
    "equipment",
    "psychosocial",
    "other",
}


class DisasterSerializer(serializers.ModelSerializer):
    location_display = serializers.CharField(read_only=True)

    class Meta:
        model = Disaster
        fields = (
            "id",
            "title",
            "description",
            "disaster_type",
            "severity",
            "province",
            "city",
            "location",
            "location_display",
            "occurred_at",
            "needs",
            "affected_population",
            "status",
            "metadata",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "location_display")

    def validate_disaster_type(self, value):
        allowed = {member.value for member in DisasterType}
        if value not in allowed:
            raise serializers.ValidationError("Invalid disaster type.")
        return value

    def validate_severity(self, value):
        allowed = {member.value for member in DisasterSeverity}
        if value not in allowed:
            raise serializers.ValidationError("Invalid severity.")
        return value

    def validate_needs(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Needs must be a list.")
        cleaned = []
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("Each need must be a string.")
            if item not in ALLOWED_NEED_KEYS:
                raise serializers.ValidationError(f"Invalid need key: {item}")
            if item not in cleaned:
                cleaned.append(item)
        return cleaned

    def validate(self, attrs):
        province = attrs.get("province", getattr(self.instance, "province", "") if self.instance else "")
        city = attrs.get("city", getattr(self.instance, "city", "") if self.instance else "")
        location = attrs.get("location", getattr(self.instance, "location", "") if self.instance else "")

        if self.instance is None and not any(
            [str(province).strip(), str(city).strip(), str(location).strip()]
        ):
            raise serializers.ValidationError("At least one location field is required.")

        return attrs
