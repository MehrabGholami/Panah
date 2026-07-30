export interface BackupRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'failed';
  backup_type: 'full' | 'db' | 'media';
  db_path: string;
  media_path: string;
  size_bytes: number;
  error_message: string;
  triggered_by: 'schedule' | 'manual' | 'cli';
  actor: string | null;
  actor_email: string | null;
  created_at: string;
  updated_at: string;
}

export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export interface BackupScheduleSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  hour: number;
  minute: number;
  weekday: number;
  day_of_month: number;
  retention_days: number;
  schedule_summary?: string;
}

export interface BackupStatusSummary {
  last_backup_status: string | null;
  last_backup_at: string | null;
  last_backup_age_hours: number | null;
  last_backup_size_bytes: number;
  last_run_id: string | null;
  last_run_error: string;
  retention_days: number;
  database_name?: string;
  schedule?: BackupScheduleSettings;
}

export interface BackupRestoreRequest {
  confirm_db_name: string;
  restore_media?: boolean;
}

export interface BackupRestoreResult {
  message: string;
  database: string;
  db_file: string;
  media_file: string;
  post_steps: string[];
}
