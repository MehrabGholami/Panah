export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  channel: string;
  resource_type?: string;
  resource_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}
