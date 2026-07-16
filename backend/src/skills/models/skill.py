from django.db import models

from common.models.base_model import BaseModel


class Skill(BaseModel):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "skills_skill"
        ordering = ["category", "name"]

    def __str__(self):
        return self.name
