export type ReportStatus = 'draft' | 'submitted' | 'reviewed';

export interface Report {
  id: string;
  mission: string;
  mission_title?: string;
  author?: string;
  author_name?: string | null;
  author_email?: string | null;
  content: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface FinishedMissionSummary {
  id: string;
  title: string;
  status: 'completed' | 'closed';
  priority: string;
  disaster_title?: string | null;
  coordinator_name?: string | null;
  coordinator_email?: string | null;
  location_display?: string;
  start_time?: string | null;
  end_time?: string | null;
  required_volunteers: number;
  applications_total: number;
  applications_approved: number;
  assignments_total: number;
  assignments_completed: number;
  assignments_checked_in: number;
  reports_total: number;
  created_at: string;
  updated_at: string;
}

export interface FinishedMissionDetail extends FinishedMissionSummary {
  description?: string;
  disaster_id?: string | null;
  province?: string;
  city?: string;
  location?: string;
  equipment_needed?: string;
  safety_notes?: string;
  special_considerations?: string;
  has_submitted_report?: boolean;
  applications?: Array<{
    id: string;
    volunteer_name?: string | null;
    volunteer_email?: string;
    status: string;
    created_at: string;
  }>;
  assignments?: Array<{
    id: string;
    volunteer_name?: string | null;
    volunteer_email?: string;
    status: string;
    created_at: string;
  }>;
  reports?: Array<{
    id: string;
    author_name?: string | null;
    author_email?: string | null;
    content: string;
    status: ReportStatus;
    created_at: string;
  }>;
}
