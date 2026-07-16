export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'checked_in' | 'completed';

export interface Assignment {
  id: string;
  mission: string;
  mission_title?: string;
  volunteer: string;
  volunteer_email?: string;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
}
