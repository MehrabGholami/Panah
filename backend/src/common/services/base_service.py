from __future__ import annotations

from typing import Generic, TypeVar

from common.repositories.base_repository import BaseRepository

T = TypeVar("T")


class BaseService(Generic[T]):
    repository: BaseRepository

    def __init__(self, repository: BaseRepository | None = None):
        self.repository = repository or self.__class__.repository()
