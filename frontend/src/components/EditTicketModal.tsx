import { useState, useEffect, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import api from '../api/axios';
import type { Ticket, TicketStatus, TicketPriority, Category } from '../types';

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onSaved: (updated: Ticket) => void;
}

export default function EditTicketModal({ ticket, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [form, setForm] = useState({
    title:       ticket.title,
    description: ticket.description,
    priority:    ticket.priority as TicketPriority,
    category_id: ticket.category_id,
    status:      ticket.status as TicketStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(r.data))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.put(`/tickets/${ticket.id}`, form);
      onSaved(res.data);
      onClose();
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.error : undefined;
      setError(msg || 'Erro ao salvar chamado.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-header">
          <button type="button" className="modal-cancel" onClick={onClose}>Cancelar</button>
          <h2>Editar Chamado</h2>
          <button
            type="submit"
            form="edit-ticket-form"
            className="modal-save"
            disabled={saving || categoriesLoading}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>

        {error && <div className="modal-error"><div className="alert alert-error">{error}</div></div>}

        <form id="edit-ticket-form" onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <label className="form-label">Título</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Título do chamado"
            />
          </div>

          <div className="form-section">
            <label className="form-label">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Descreva o problema em detalhe…"
            />
          </div>

          <div className="form-row form-row--gap">
            <div className="form-section form-section--no-mb">
              <label className="form-label">Prioridade</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">🟢 Baixa</option>
                <option value="medium">🔵 Média</option>
                <option value="high">🟡 Alta</option>
                <option value="urgent">🔴 Urgente</option>
              </select>
            </div>

            <div className="form-section form-section--no-mb">
              <label className="form-label">Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Atendimento</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Categoria</label>
            {categoriesLoading ? (
              <p className="loading-text">Carregando categorias…</p>
            ) : (
              <select name="category_id" value={form.category_id} onChange={handleChange} required>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
