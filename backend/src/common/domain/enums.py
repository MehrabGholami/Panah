from enum import Enum


class StrEnum(str, Enum):
    """String enum compatible with Python 3.10+."""

    @classmethod
    def choices(cls):
        return [(member.value, member.name.replace("_", " ").title()) for member in cls]
