from common.domain.enums import StrEnum


class AssignmentStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CHECKED_IN = "checked_in"
    COMPLETED = "completed"
