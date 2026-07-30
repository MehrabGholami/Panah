from common.domain.enums import StrEnum


class BackupStatus(StrEnum):
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class BackupType(StrEnum):
    FULL = "full"
    DB = "db"
    MEDIA = "media"


class BackupTriggeredBy(StrEnum):
    SCHEDULE = "schedule"
    MANUAL = "manual"
    CLI = "cli"


class BackupFrequency(StrEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
