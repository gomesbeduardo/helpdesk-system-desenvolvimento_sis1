/**
 * Tipos e interfaces centrais do domínio da aplicação.
 * Compartilhados entre controllers, middlewares e rotas.
 */

/** Perfis de usuário com diferentes níveis de acesso ao sistema. */
export type UserRole = 'user' | 'technician' | 'admin';

/** Ciclo de vida de um chamado: aberto → em atendimento → resolvido → fechado. */
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** Urgência do chamado, usado para ordenação e destaque visual. */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/** Representa um usuário cadastrado no sistema. A senha é armazenada como hash bcrypt. */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

/** Categoria de agrupamento dos chamados (ex.: Hardware, Software, Rede). */
export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/** Chamado de suporte aberto por um usuário. */
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  user_id: string;
  category_id: string;
  created_at: Date;
  updated_at: Date;
}

/** Comentário feito por qualquer usuário autorizado dentro de um chamado. */
export interface Comment {
  id: string;
  message: string;
  ticket_id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Registro imutável de cada alteração de status de um chamado.
 * Permite auditoria completa do ciclo de vida do chamado.
 * old_status é null apenas na criação do chamado (não há status anterior).
 */
export interface TicketStatusHistory {
  id: string;
  ticket_id: string;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  changed_by: string;
  created_at: Date;
}

/** Payload armazenado dentro do token JWT. Não inclui dados sensíveis como senha. */
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Extensão do tipo Request do Express para incluir o usuário autenticado.
// Permite que controllers acessem req.user sem castings repetitivos.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
