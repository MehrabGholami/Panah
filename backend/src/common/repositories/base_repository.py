from __future__ import annotations

from typing import Generic, TypeVar

from django.db import models

from common.models.base_model import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseRepository(Generic[T]):
    model: type[T]

    def __init__(self, model: type[T] | None = None):
        self.model = model or self.__class__.model

    def get_by_id(self, pk) -> T | None:
        return self.model.objects.filter(pk=pk).first()

    def list(self, **filters):
        return self.model.objects.filter(**filters)

    def create(self, **data) -> T:
        return self.model.objects.create(**data)

    def update(self, instance: T, **data) -> T:
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    def soft_delete(self, instance: T) -> None:
        instance.soft_delete()

    def exists(self, **filters) -> bool:
        return self.model.objects.filter(**filters).exists()

    def get_or_create(self, defaults: dict | None = None, **kwargs) -> tuple[T, bool]:
        return self.model.objects.get_or_create(defaults=defaults or {}, **kwargs)

    def bulk_create(self, items: list[dict]) -> list[T]:
        return self.model.objects.bulk_create([self.model(**item) for item in items])
