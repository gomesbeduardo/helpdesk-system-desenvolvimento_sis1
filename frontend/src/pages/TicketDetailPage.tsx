import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../api/axios';
import type { Ticket, Comment, HistoryEntry, TicketStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import EditTicketModal from '../components/EditTicketModal';
import { statusLabel, statusClass, priorityLabel } from '../constants/ticket';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket]           = useState<Ticket | null>(null);
  const [comments, setComments]       = useState<Comment[]>([]);
  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [newComment, setNewComment]   = useState('');
  const [newStatus, setNewStatus]     = useState<TicketStatus>('open');
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [tab, setTab]                 = useState<'comments' | 'history'>('comments');
  const [showEdit, setShowEdit]       = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/tickets/${id}`),
      api.get(`/tickets/${id}/comments`),
      api.get(`/tickets/${id}/history`),
    ]).then(([t, c, h]) => {
      setTicket(t.data);
      setNewStatus(t.data.status);
      setComments(c.data);
      setHistory(h.data);
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/tickets/${id}/comments`, { message: newComment });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.error : undefined;
      setError(msg || 'Erro ao comentar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange() {
    if (!ticket || newStatus === ticket.status) return;
    setError('');
    try {
      const res = await api.patch(`/tickets/${id}/status`, { status: newStatus });
      setTicket(prev => prev ? { ...prev, status: res.data.status } : prev);
      const h = await api.get(`/tickets/${id}/history`);
      setHistory(h.data);
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.error : undefined;
      setError(msg || 'Erro ao alterar status.');
    }
  }

  function handleSaved(updated: Ticket) {
    setTicket(updated);
    setNewStatus(updated.status);
    api.get(`/tickets/${id}/history`).then(r => setHistory(r.data));
  }

  if (loading) return <div className="loading">Carregando</div>;
  if (!ticket) return null;

  const canChangeStatus = user?.role === 'technician' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="page">
      <div className="ticket-detail-actions">
        <button className="btn btn-sm btn-outline" onClick={() => navigate('/tickets')}>← Voltar</button>
        {isAdmin && (
          <button className="btn btn-sm btn-outline" onClick={() => setShowEdit(true)}>
            ✏️ Editar Chamado
          </button>
        )}
      </div>

      <div className="ticket-detail-header">
        <div>
          <h1>{ticket.title}</h1>
          <div className="ticket-meta-row">
            <span className={`badge ${statusClass[ticket.status]}`}>{statusLabel[ticket.status]}</span>
            <span className={`priority-tag priority-${ticket.priority}`}>{priorityLabel[ticket.priority]}</span>
            <span className="meta-item">📂 {ticket.category_name}</span>
            <span className="meta-item">👤 {ticket.user_name}</span>
            <span className="meta-item">📅 {new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {canChangeStatus && !isAdmin && (
          <div className="status-changer">
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as TicketStatus)}>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Atendimento</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleStatusChange}
              disabled={newStatus === ticket.status}
            >
              Alterar Status
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Descrição</h3>
        <p className="ticket-description">{ticket.description}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab-btn ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>
          Comentários ({comments.length})
        </button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Histórico ({history.length})
        </button>
      </div>

      {tab === 'comments' && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.length === 0 && <p className="empty-text">Nenhum comentário ainda.</p>}
            {comments.map(c => (
              <div key={c.id} className={`comment ${c.user_id === user?.id ? 'comment-own' : ''}`}>
                <div className="comment-header">
                  <strong>{c.user_name}</strong>
                  <span className="comment-role">{c.user_role}</span>
                  <span className="comment-date">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p>{c.message}</p>
              </div>
            ))}
          </div>
          {isClosed ? (
            <p className="empty-text">Chamado encerrado — comentários desabilitados.</p>
          ) : (
            <form onSubmit={handleComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Escreva um comentário…"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Comentar'}
              </button>
            </form>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="history-section">
          {history.length === 0 && <p className="empty-text">Sem histórico.</p>}
          {history.map(h => (
            <div key={h.id} className="history-entry">
              <span className="history-arrow">
                {h.old_status ? `${statusLabel[h.old_status]} → ` : ''}
                <strong>{statusLabel[h.new_status]}</strong>
              </span>
              <span className="history-by">por {h.changed_by_name}</span>
              <span className="history-date">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}

      {showEdit && ticket && (
        <EditTicketModal
          ticket={ticket}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
