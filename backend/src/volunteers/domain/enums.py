from common.domain.enums import StrEnum


class VolunteerStatus(StrEnum):
    REGISTERED = "registered"
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    REJECTED = "rejected"


class VolunteerGender(StrEnum):
    FEMALE = "female"
    MALE = "male"
    UNSPECIFIED = "unspecified"
