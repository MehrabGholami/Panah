export interface UserProfileData {
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
}

export interface VolunteerProfileData {
  national_id?: string;
  city?: string;
  bio?: string;
  gender?: 'female' | 'male' | 'unspecified';
  status?: string;
}

export interface UpdateProfileRequest {
  phone?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  bio?: string;
  gender?: 'female' | 'male' | 'unspecified';
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
}
