export type UserRole = 'user' | 'technician' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  user_id: string;
  user_name?: string;
  category_id: string;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  message: string;
  ticket_id: string;
  user_id: string;
  user_name?: string;
  user_role?: UserRole;
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  ticket_id: string;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  changed_by: string;
  changed_by_name?: string;
  created_at: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}
