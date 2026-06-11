import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets/stats')
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bem-vindo, {user?.name}! 👋</h1>
          <p className="subtitle">Sistema de Chamados / Help Desk</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ Abrir Chamado</Link>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="stats-grid">
          <Link to="/tickets?status=open" className="stat-card stat-blue">
            <div className="stat-number">{stats.open}</div>
            <div className="stat-label">Abertos</div>
          </Link>
          <Link to="/tickets?status=in_progress" className="stat-card stat-yellow">
            <div className="stat-number">{stats.in_progress}</div>
            <div className="stat-label">Em Atendimento</div>
          </Link>
          <Link to="/tickets?status=resolved" className="stat-card stat-green">
            <div className="stat-number">{stats.resolved}</div>
            <div className="stat-label">Resolvidos</div>
          </Link>
          <Link to="/tickets?status=closed" className="stat-card stat-gray">
            <div className="stat-number">{stats.closed}</div>
            <div className="stat-label">Fechados</div>
          </Link>
          <Link to="/tickets" className="stat-card stat-purple">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </Link>
        </div>
      )}

      <div className="quick-actions">
        <h2>Ações rápidas</h2>
        <div className="action-cards">
          <Link to="/tickets/new" className="action-card">
            <span className="action-icon">📝</span>
            <span>Abrir Chamado</span>
          </Link>
          <Link to="/tickets" className="action-card">
            <span className="action-icon">📋</span>
            <span>Ver Chamados</span>
          </Link>
          {(user?.role === 'admin' || user?.role === 'technician') && (
            <Link to="/categories" className="action-card">
              <span className="action-icon">📂</span>
              <span>Categorias</span>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/users" className="action-card">
              <span className="action-icon">👥</span>
              <span>Usuários</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
