from django.test import TestCase

from accounts.models import Role, User, UserRole
from assignments.application.services.assignment_task_service import AssignmentTaskService
from assignments.domain.enums import AssignmentStatus, AssignmentTaskStatus
from assignments.models import Assignment, AssignmentTask
from common.exceptions.api_exceptions import PermissionDeniedError, ValidationError
from disasters.models import Disaster
from missions.models import Mission
from volunteers.models import VolunteerProfile


class AssignmentTaskServiceTests(TestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(name="Admin", slug="admin", is_system=True)
        self.coordinator_role = Role.objects.create(
            name="Coordinator", slug="coordinator", is_system=True
        )
        self.volunteer_role = Role.objects.create(
            name="Volunteer", slug="volunteer", is_system=True
        )

        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="test-pass-123",
            is_approved=True,
            first_name="Admin",
        )
        UserRole.objects.create(user=self.admin, role=self.admin_role)

        self.coordinator = User.objects.create_user(
            email="coord@example.com",
            password="test-pass-123",
            is_approved=True,
            first_name="Coord",
        )
        UserRole.objects.create(user=self.coordinator, role=self.coordinator_role)

        self.other_coordinator = User.objects.create_user(
            email="other-coord@example.com",
            password="test-pass-123",
            is_approved=True,
            first_name="Other",
        )
        UserRole.objects.create(user=self.other_coordinator, role=self.coordinator_role)

        self.volunteer_user = User.objects.create_user(
            email="volunteer@example.com",
            password="test-pass-123",
            is_approved=True,
            first_name="Mehrab",
        )
        UserRole.objects.create(user=self.volunteer_user, role=self.volunteer_role)
        self.volunteer = VolunteerProfile.objects.create(
            user=self.volunteer_user,
            national_id="0012345678",
            city="Tehran",
        )

        disaster = Disaster.objects.create(title="Test Disaster")
        self.mission = Mission.objects.create(
            disaster=disaster,
            title="Test Mission",
            coordinator=self.coordinator,
        )
        self.assignment = Assignment.objects.create(
            mission=self.mission,
            volunteer=self.volunteer,
            status=AssignmentStatus.PENDING,
        )
        self.service = AssignmentTaskService()

    def test_create_rejected_while_pending(self):
        with self.assertRaises(ValidationError):
            self.service.create(self.assignment.id, self.coordinator, title="Distribute water")

    def test_create_allowed_after_accept(self):
        self.assignment.status = AssignmentStatus.ACCEPTED
        self.assignment.save(update_fields=["status", "updated_at"])

        task = self.service.create(
            self.assignment.id,
            self.coordinator,
            title="Distribute water",
            description="Zone A",
        )
        self.assertEqual(task.title, "Distribute water")
        self.assertEqual(task.status, AssignmentTaskStatus.NOT_DONE)
        self.assertEqual(task.created_by_id, self.coordinator.id)

    def test_admin_cannot_create_tasks(self):
        self.assignment.status = AssignmentStatus.ACCEPTED
        self.assignment.save(update_fields=["status", "updated_at"])

        with self.assertRaises(PermissionDeniedError):
            self.service.create(self.assignment.id, self.admin, title="Admin task")

    def test_other_coordinator_cannot_create_tasks(self):
        self.assignment.status = AssignmentStatus.ACCEPTED
        self.assignment.save(update_fields=["status", "updated_at"])

        with self.assertRaises(PermissionDeniedError):
            self.service.create(
                self.assignment.id, self.other_coordinator, title="Foreign task"
            )

    def test_volunteer_cannot_create_tasks(self):
        self.assignment.status = AssignmentStatus.ACCEPTED
        self.assignment.save(update_fields=["status", "updated_at"])

        with self.assertRaises(PermissionDeniedError):
            self.service.create(self.assignment.id, self.volunteer_user, title="Self task")

    def test_volunteer_can_report_status(self):
        self.assignment.status = AssignmentStatus.ACCEPTED
        self.assignment.save(update_fields=["status", "updated_at"])
        task = AssignmentTask.objects.create(
            assignment=self.assignment,
            title="First aid",
            created_by=self.coordinator,
        )

        updated = self.service.report_status(
            task.id, self.volunteer_user, AssignmentTaskStatus.IN_PROGRESS
        )
        self.assertEqual(updated.status, AssignmentTaskStatus.IN_PROGRESS)
        self.assertIsNotNone(updated.status_updated_at)

        done = self.service.report_status(
            task.id, self.volunteer_user, AssignmentTaskStatus.DONE
        )
        self.assertEqual(done.status, AssignmentTaskStatus.DONE)

    def test_coordinator_cannot_report_status(self):
        self.assignment.status = AssignmentStatus.ACCEPTED
        self.assignment.save(update_fields=["status", "updated_at"])
        task = AssignmentTask.objects.create(
            assignment=self.assignment,
            title="First aid",
            created_by=self.coordinator,
        )

        with self.assertRaises(PermissionDeniedError):
            self.service.report_status(
                task.id, self.coordinator, AssignmentTaskStatus.DONE
            )

    def test_delete_soft_deletes_task(self):
        self.assignment.status = AssignmentStatus.CHECKED_IN
        self.assignment.save(update_fields=["status", "updated_at"])
        task = self.service.create(self.assignment.id, self.coordinator, title="Cleanup")

        self.service.delete(task.id, self.coordinator)
        self.assertFalse(AssignmentTask.objects.filter(pk=task.id).exists())
        self.assertTrue(AssignmentTask.all_objects.filter(pk=task.id).exists())
