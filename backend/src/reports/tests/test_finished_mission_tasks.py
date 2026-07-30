from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from assignments.domain.enums import AssignmentStatus, AssignmentTaskStatus
from assignments.models import Assignment, AssignmentTask
from disasters.models import Disaster
from missions.domain.enums import MissionStatus
from missions.models import Mission
from reports.application.services.finished_mission_report_service import (
    FinishedMissionReportService,
)
from volunteers.models import VolunteerProfile


class FinishedMissionVolunteerTasksTests(TestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            email="coord@example.com",
            password="test-pass-123",
            is_approved=True,
            first_name="Ali",
            last_name="Tayyebi",
        )
        self.volunteer_user = User.objects.create_user(
            email="volunteer@example.com",
            password="test-pass-123",
            is_approved=True,
            first_name="Mehrab",
            last_name="Gholami",
        )
        self.volunteer = VolunteerProfile.objects.create(
            user=self.volunteer_user,
            national_id="0012345678",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="test-pass-123",
            is_approved=True,
            first_name="Sara",
        )
        self.other_volunteer = VolunteerProfile.objects.create(
            user=self.other_user,
            national_id="0098765432",
        )
        disaster = Disaster.objects.create(title="Test Earthquake")
        self.mission = Mission.objects.create(
            disaster=disaster,
            title="Relief packages",
            coordinator=self.coordinator,
            status=MissionStatus.COMPLETED,
        )
        self.assignment = Assignment.objects.create(
            mission=self.mission,
            volunteer=self.volunteer,
            status=AssignmentStatus.ACCEPTED,
        )
        self.other_assignment = Assignment.objects.create(
            mission=self.mission,
            volunteer=self.other_volunteer,
            status=AssignmentStatus.ACCEPTED,
        )
        self.service = FinishedMissionReportService()

    def test_summary_without_tasks(self):
        summary = self.service.build_summary(self.mission)
        self.assertEqual(summary["tasks_total"], 0)
        self.assertEqual(summary["tasks_done"], 0)
        self.assertEqual(summary["tasks_in_progress"], 0)
        self.assertEqual(summary["tasks_not_done"], 0)
        self.assertEqual(summary["volunteer_tasks"], [])

    def test_summary_groups_and_counts_tasks(self):
        AssignmentTask.objects.create(
            assignment=self.assignment,
            title="Pack boxes",
            description="Zone A",
            status=AssignmentTaskStatus.DONE,
            created_by=self.coordinator,
            status_updated_at=timezone.now(),
        )
        AssignmentTask.objects.create(
            assignment=self.assignment,
            title="Deliver packs",
            status=AssignmentTaskStatus.IN_PROGRESS,
            created_by=self.coordinator,
        )
        AssignmentTask.objects.create(
            assignment=self.other_assignment,
            title="Guide crowd",
            status=AssignmentTaskStatus.NOT_DONE,
            created_by=self.coordinator,
        )

        summary = self.service.build_summary(self.mission)

        self.assertEqual(summary["tasks_total"], 3)
        self.assertEqual(summary["tasks_done"], 1)
        self.assertEqual(summary["tasks_in_progress"], 1)
        self.assertEqual(summary["tasks_not_done"], 1)
        self.assertEqual(len(summary["volunteer_tasks"]), 2)

        first = next(
            g
            for g in summary["volunteer_tasks"]
            if g["assignment_id"] == str(self.assignment.pk)
        )
        self.assertEqual(first["volunteer_name"], "Mehrab Gholami")
        self.assertEqual(first["tasks_total"], 2)
        self.assertEqual(first["tasks_done"], 1)
        self.assertEqual(len(first["tasks"]), 2)
        self.assertEqual(first["tasks"][0]["title"], "Pack boxes")
        self.assertEqual(first["tasks"][0]["status"], AssignmentTaskStatus.DONE)

        second = next(
            g
            for g in summary["volunteer_tasks"]
            if g["assignment_id"] == str(self.other_assignment.pk)
        )
        self.assertEqual(second["tasks_total"], 1)
        self.assertEqual(second["tasks_done"], 0)
