import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Ticket, TicketStatus, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';

const statusLabel: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const statusClass: Record<TicketStatus, string> = {
  open: 'badge-blue',
  in_progress: 'badge-yellow',
  resolved: 'badge-green',
  closed: 'badge-gray',
};

const priorityLabel: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityClass: Record<string, string> = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  urgent: 'priority-urgent',
};

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    search: '',
    sort: '',
  });

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 10 };
    if (filters.status) params['status'] = filters.status;
    if (filters.category_id) params['category_id'] = filters.category_id;
    if (filters.search) params['search'] = filters.search;
    if (filters.sort) params['sort'] = filters.sort;

    api.get('/tickets', { params })
      .then((r) => {
        setTickets(r.data.tickets);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, filters]);

  function handleFilter(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Chamados</h1>
        <Link to="/tickets/new" className="btn btn-primary">+ Abrir Chamado</Link>
      </div>

      <div className="filters">
        <input
          name="search"
          placeholder="Buscar por título ou descrição..."
          value={filters.search}
          onChange={handleFilter}
          className="search-input"
        />
        <select name="status" value={filters.status} onChange={handleFilter}>
          <option value="">Todos os status</option>
          <option value="open">Aberto</option>
          <option value="in_progress">Em Atendimento</option>
          <option value="resolved">Resolvido</option>
          <option value="closed">Fechado</option>
        </select>
        <select name="category_id" value={filters.category_id} onChange={handleFilter}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="sort" value={filters.sort} onChange={handleFilter}>
          <option value="">Ordenar por data</option>
          <option value="priority">Ordenar por prioridade</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum chamado encontrado.</p>
          <Link to="/tickets/new" className="btn btn-primary">Abrir primeiro chamado</Link>
        </div>
      ) : (
        <>
          <div className="tickets-list">
            {tickets.map((t) => (
              <Link to={`/tickets/${t.id}`} key={t.id} className="ticket-card">
                <div className="ticket-card-header">
                  <h3>{t.title}</h3>
                  <span className={`badge ${statusClass[t.status]}`}>{statusLabel[t.status]}</span>
                </div>
                <div className="ticket-card-meta">
                  <span className={`priority-tag ${priorityClass[t.priority]}`}>
                    {priorityLabel[t.priority]}
                  </span>
                  <span className="category-tag">{t.category_name}</span>
                  {user?.role !== 'user' && <span className="user-tag">👤 {t.user_name}</span>}
                  <span className="date-tag">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="ticket-card-desc">{t.description.substring(0, 120)}{t.description.length > 120 ? '...' : ''}</p>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm">← Anterior</button>
              <span>Página {page} de {totalPages} ({total} chamados)</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-sm">Próxima →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
