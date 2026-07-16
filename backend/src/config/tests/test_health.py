import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_health_endpoint(api_client):
    response = api_client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.django_db
def test_seed_creates_admin():
    from django.core.management import call_command
    from accounts.models import User

    call_command("seed_data", admin_email="test@example.com", admin_password="testpass123!")
    assert User.objects.filter(email="test@example.com").exists()
