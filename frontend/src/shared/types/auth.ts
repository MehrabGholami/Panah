export interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_staff: boolean;
  avatar?: string | null;
  profile?: import('./profile').UserProfileData | null;
  volunteer_profile?: import('./profile').VolunteerProfileData | null;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  national_id: string;
  phone: string;
  first_name: string;
  last_name: string;
  gender?: 'female' | 'male' | 'unspecified';
  city?: string;
  bio?: string;
  skill_names?: string[];
  custom_skill_names?: string[];
}

export interface TokenPair {
  access: string;
  refresh: string;
}
