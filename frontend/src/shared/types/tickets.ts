export type TicketStatus = 'open' | 'in_progress' | 'answered' | 'closed';

export interface TicketReply {
  id: string;
  ticket: string;
  author: string;
  author_name?: string;
  body: string;
  is_staff_reply: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  author: string;
  author_name?: string;
  opened_by?: string | null;
  opened_by_name?: string | null;
  is_staff_message?: boolean;
  replies?: TicketReply[];
  reply_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  recipient_id?: string;
}

export interface CreateTicketReplyRequest {
  body: string;
}
