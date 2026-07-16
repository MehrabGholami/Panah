export type VolunteerStatus = 'registered' | 'pending_approval' | 'active' | 'rejected';

export interface VolunteerSkill {
  name: string;
  category: string;
  proficiency: number;
}

export interface VolunteerAvailability {
  weekdays?: boolean;
  weekends?: boolean;
  shifts?: string[];
}

export interface Volunteer {
  id: string;
  user_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  national_id?: string;
  city?: string;
  bio?: string;
  status: VolunteerStatus;
  avatar?: string | null;
  availability?: VolunteerAvailability | Record<string, unknown>;
  skills?: VolunteerSkill[];
  custom_skills?: string[];
  education?: string;
  occupation?: string;
  interests?: string;
  address?: string;
  blood_type?: string;
  languages?: string;
  years_of_experience?: number | null;
  date_of_birth?: string | null;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  disability?: string;
  created_at: string;
  updated_at?: string;
}
