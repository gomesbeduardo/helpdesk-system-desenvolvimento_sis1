import type { TicketStatus } from '../types';

export const statusLabel: Record<TicketStatus, string> = {
  open:        'Aberto',
  in_progress: 'Em Atendimento',
  resolved:    'Resolvido',
  closed:      'Fechado',
};

export const statusClass: Record<TicketStatus, string> = {
  open:        'badge-blue',
  in_progress: 'badge-yellow',
  resolved:    'badge-green',
  closed:      'badge-gray',
};

export const priorityLabel: Record<string, string> = {
  low:    'Baixa',
  medium: 'Média',
  high:   'Alta',
  urgent: 'Urgente',
};

export const priorityClass: Record<string, string> = {
  low:    'priority-low',
  medium: 'priority-medium',
  high:   'priority-high',
  urgent: 'priority-urgent',
};
