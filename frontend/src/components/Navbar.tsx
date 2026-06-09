import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const roleClass: Record<string, string> = {
  user:       'role-badge role-badge-user',
  technician: 'role-badge role-badge-technician',
  admin:      'role-badge role-badge-admin',
};

const roleLabel: Record<string, string> = {
  user: 'Usuário', technician: 'Técnico', admin: 'Admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() { logout(); navigate('/login'); }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* ── Desktop / Top bar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">Help Desk</Link>
        </div>

        <div className="navbar-links">
          <Link to="/"           style={isActive('/tickets') || isActive('/categories') || isActive('/users') ? {} : { color: 'var(--label)' }}>Início</Link>
          <Link to="/tickets"    style={isActive('/tickets')    ? { color: 'var(--blue)' } : {}}>Chamados</Link>
          <Link to="/tickets/new">Abrir Chamado</Link>
          {(user?.role === 'admin' || user?.role === 'technician') && (
            <Link to="/categories" style={isActive('/categories') ? { color: 'var(--blue)' } : {}}>Categorias</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/users" style={isActive('/users') ? { color: 'var(--blue)' } : {}}>Usuários</Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-info">
            {user?.name}
            <span className={roleClass[user?.role ?? 'user']}>
              {roleLabel[user?.role ?? 'user']}
            </span>
          </span>
          <button className="btn btn-sm btn-outline" onClick={handleLogout}>Sair</button>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="tab-bar">
        <Link to="/" className={`tab-item ${location.pathname === '/' ? 'active' : ''}`}>
          <span className="tab-icon">⌂</span>
          <span className="tab-label">Início</span>
        </Link>

        <Link to="/tickets" className={`tab-item ${isActive('/tickets') ? 'active' : ''}`}>
          <span className="tab-icon">📋</span>
          <span className="tab-label">Chamados</span>
        </Link>

        <Link to="/tickets/new" className="tab-item">
          <span className="tab-icon" style={{ fontSize: 26, fontWeight: 300, lineHeight: 1 }}>＋</span>
          <span className="tab-label">Novo</span>
        </Link>

        {(user?.role === 'admin' || user?.role === 'technician') && (
          <Link to="/categories" className={`tab-item ${isActive('/categories') ? 'active' : ''}`}>
            <span className="tab-icon">📂</span>
            <span className="tab-label">Categorias</span>
          </Link>
        )}

        {user?.role === 'admin' && (
          <Link to="/users" className={`tab-item ${isActive('/users') ? 'active' : ''}`}>
            <span className="tab-icon">👥</span>
            <span className="tab-label">Usuários</span>
          </Link>
        )}

        <button className="tab-item" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span className="tab-icon">↩</span>
          <span className="tab-label">Sair</span>
        </button>
      </nav>
    </>
  );
}
