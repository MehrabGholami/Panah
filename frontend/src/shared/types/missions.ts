export type MissionStatus =
  | 'draft'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'closed';

export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export type MissionApplicationStatus =
  | 'submitted'
  | 'waitlist'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export interface MissionRequiredSkill {
  id: string;
  skill_id: string;
  skill_name: string;
  skill_category: string;
  is_required: boolean;
}

export interface Mission {
  id: string;
  disaster: string;
  disaster_title?: string;
  title: string;
  description: string;
  coordinator?: string;
  coordinator_email?: string;
  coordinator_name?: string;
  status: MissionStatus;
  priority: MissionPriority;
  province?: string;
  city?: string;
  location?: string;
  location_display?: string;
  start_time?: string | null;
  end_time?: string | null;
  is_end_time_tba?: boolean;
  required_volunteers: number;
  special_considerations?: string;
  equipment_needed?: string;
  safety_notes?: string;
  is_visible_to_volunteers: boolean;
  allow_volunteer_applications: boolean;
  metadata?: Record<string, unknown>;
  required_skills?: MissionRequiredSkill[];
  required_skill_ids?: string[];
  applications_count?: number;
  pending_applications_count?: number;
  assignments_count?: number;
  user_has_applied?: boolean;
  user_application_status?: MissionApplicationStatus | null;
  created_at: string;
  updated_at: string;
}

export interface MissionApplication {
  id: string;
  mission: string;
  volunteer: string;
  volunteer_name?: string;
  volunteer_email?: string;
  mission_title?: string;
  message?: string;
  status: MissionApplicationStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMissionRequest {
  disaster: string;
  title: string;
  description?: string;
  priority?: MissionPriority;
  province?: string;
  city?: string;
  location?: string;
  start_time?: string | null;
  end_time?: string | null;
  is_end_time_tba?: boolean;
  required_volunteers?: number;
  special_considerations?: string;
  equipment_needed?: string;
  safety_notes?: string;
  is_visible_to_volunteers?: boolean;
  allow_volunteer_applications?: boolean;
  metadata?: Record<string, unknown>;
  required_skill_ids?: string[];
  coordinator?: string;
}
