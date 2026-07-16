from django.db import models

from common.models.base_model import BaseModel


class UserProfile(BaseModel):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="profile",
    )
    education = models.CharField(max_length=255, blank=True)
    occupation = models.CharField(max_length=150, blank=True)
    interests = models.TextField(blank=True)
    address = models.TextField(blank=True)
    blood_type = models.CharField(max_length=10, blank=True)
    languages = models.CharField(max_length=255, blank=True)
    years_of_experience = models.PositiveSmallIntegerField(null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    medical_conditions = models.TextField(blank=True)
    disability = models.TextField(blank=True)

    class Meta:
        db_table = "accounts_user_profile"

    def __str__(self):
        return f"Profile for {self.user.email}"
