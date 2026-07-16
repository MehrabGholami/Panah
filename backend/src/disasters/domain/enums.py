from common.domain.enums import StrEnum


class DisasterSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DisasterStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class DisasterType(StrEnum):
    EARTHQUAKE = "earthquake"
    FLOOD = "flood"
    FIRE = "fire"
    STORM = "storm"
    LANDSLIDE = "landslide"
    EPIDEMIC = "epidemic"
    DROUGHT = "drought"
    INDUSTRIAL = "industrial"
    OTHER = "other"
