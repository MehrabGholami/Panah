export interface Permission {
  id: string;
  codename: string;
  name: string;
  app_label: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name?: string | null;
  user_roles?: string[];
  action: string;
  resource_type: string;
  resource_id: string;
  change_summary?: string;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AccountUser {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  national_id?: string | null;
  city?: string;
  skills?: string[];
  is_approved: boolean;
  is_active: boolean;
  roles: string[];
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}
