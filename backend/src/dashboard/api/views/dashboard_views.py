from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.base import HasPermission
from dashboard.application.services.dashboard_service import DashboardService


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "dashboard.view"

    def get(self, request):
        stats = DashboardService().get_stats(request.user)
        return Response(stats)
