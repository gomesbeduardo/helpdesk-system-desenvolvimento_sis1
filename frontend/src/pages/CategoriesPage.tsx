import { useEffect, useState, type FormEvent } from 'react';
import api from '../api/axios';
import type { Category } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function CategoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.get('/categories').then((r) => setCategories(r.data));
  }

  useEffect(() => { load(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function startEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setShowForm(true);
  }

  function cancelForm() {
    setEditing(null);
    setForm({ name: '', description: '' });
    setShowForm(false);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
      } else {
        await api.post('/categories', form);
      }
      load();
      cancelForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar categoria.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Categorias</h1>
        {isAdmin && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nova Categoria</button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="card">
          <h2>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={cancelForm}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      )}

      <div className="categories-list">
        {categories.map((c) => (
          <div key={c.id} className="category-card">
            <div>
              <h3>{c.name}</h3>
              {c.description && <p>{c.description}</p>}
            </div>
            {isAdmin && (
              <div className="card-actions">
                <button className="btn btn-sm btn-outline" onClick={() => startEdit(c)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Excluir</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
