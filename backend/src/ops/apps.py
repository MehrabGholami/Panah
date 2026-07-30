from django.apps import AppConfig
from django.contrib import admin


class OpsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ops"
    verbose_name = "Operations & Backup"

    def ready(self):
        admin.site.site_header = "Panah Administration"
        admin.site.site_title = "Panah Admin"
        admin.site.index_title = "Volunteer & Crisis Management"
