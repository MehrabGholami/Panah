export interface DashboardChartSlice {
  key: string;
  label: string;
  value: number;
}

export interface DashboardTrendPoint {
  date: string;
  missions: number;
  disasters: number;
}

export interface DashboardKpis {
  active_disasters?: number;
  inactive_disasters?: number;
  total_disasters?: number;
  open_missions?: number;
  missions_in_progress?: number;
  pending_volunteers?: number;
  active_volunteers?: number;
  active_assignments?: number;
  completed_missions?: number;
  pending_reports?: number;
  pending_applications?: number;
  unread_notifications?: number;
  available_missions?: number;
  my_applications_total?: number;
  my_applications_pending?: number;
  my_applications_approved?: number;
  my_assignments_active?: number;
  my_assignments_completed?: number;
  my_missions_in_progress?: number;
  my_missions_total?: number;
  my_missions_draft?: number;
  my_missions_published?: number;
}

export interface DashboardCharts {
  disaster_status: DashboardChartSlice[];
  mission_status: DashboardChartSlice[];
  volunteer_pipeline: DashboardChartSlice[];
  mission_application_status?: DashboardChartSlice[];
  assignment_status: DashboardChartSlice[];
  activity_trend: DashboardTrendPoint[];
  my_application_status?: DashboardChartSlice[];
  my_assignment_status?: DashboardChartSlice[];
  skill_distribution?: DashboardChartSlice[];
  gender_distribution?: DashboardChartSlice[];
}

export type DashboardScope = 'staff' | 'coordinator' | 'volunteer';

export interface DashboardStats {
  scope?: DashboardScope;
  role?: string;
  kpis: DashboardKpis;
  charts: DashboardCharts;
}
