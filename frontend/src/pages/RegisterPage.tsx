import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users', form);
      await login(form.email, form.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🎫 Help Desk</h1>
        <h2>Criar conta</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Seu nome" />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="seu@email.com" />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="auth-link">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
