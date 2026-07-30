export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'checked_in' | 'completed';

export type AssignmentTaskStatus = 'not_done' | 'in_progress' | 'done';

export interface Assignment {
  id: string;
  mission: string;
  mission_title?: string;
  volunteer: string;
  volunteer_email?: string;
  volunteer_name?: string;
  status: AssignmentStatus;
  tasks_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentTask {
  id: string;
  assignment: string;
  title: string;
  description: string;
  status: AssignmentTaskStatus;
  created_by: string;
  created_by_name?: string;
  status_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}
