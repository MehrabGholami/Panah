from django.test import TestCase

from accounts.application.services.user_service import UserService
from accounts.models import Role, User, UserRole
from common.exceptions.api_exceptions import ValidationError


class UserRoleAssignmentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="volunteer@example.com",
            password="test-pass-123",
            first_name="Test",
            last_name="Volunteer",
        )
        self.volunteer_role = Role.objects.create(
            name="Volunteer",
            slug="volunteer",
            is_system=True,
        )
        self.coordinator_role = Role.objects.create(
            name="Coordinator",
            slug="coordinator",
            is_system=True,
        )
        UserRole.objects.create(user=self.user, role=self.volunteer_role)

    def test_reassigning_existing_role_restores_soft_deleted_record(self):
        service = UserService()

        updated = service.assign_roles(self.user.id, ["volunteer"])
        role_slugs = {user_role.role.slug for user_role in updated.user_roles.all()}

        self.assertEqual(role_slugs, {"volunteer"})
        self.assertTrue(
            UserRole.all_objects.filter(
                user=self.user,
                role=self.volunteer_role,
                deleted_at__isnull=True,
            ).exists()
        )

    def test_assigning_new_role_replaces_previous_role(self):
        service = UserService()

        updated = service.assign_roles(self.user.id, ["coordinator"])
        role_slugs = {user_role.role.slug for user_role in updated.user_roles.all()}

        self.assertEqual(role_slugs, {"coordinator"})
        self.assertFalse(
            UserRole.objects.filter(user=self.user, role=self.volunteer_role).exists()
        )

    def test_assigning_multiple_roles_is_rejected(self):
        service = UserService()

        with self.assertRaises(ValidationError):
            service.assign_roles(self.user.id, ["volunteer", "coordinator"])
