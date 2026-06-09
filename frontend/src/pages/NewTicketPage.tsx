import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Category } from '../types';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/tickets', form);
      navigate(`/tickets/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar chamado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Abrir Chamado</h1>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="Descreva o problema em poucas palavras" />
          </div>
          <div className="form-group">
            <label>Descrição *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={5} placeholder="Detalhe o problema..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Prioridade *</label>
              <select name="priority" value={form.priority} onChange={handleChange} required>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div className="form-group">
              <label>Categoria *</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} required>
                <option value="">Selecione uma categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Abrir Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
