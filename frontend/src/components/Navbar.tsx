import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const roleLabel: Record<string, string> = {
  user: 'Usuário',
  technician: 'Técnico',
  admin: 'Admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🎫 Help Desk</Link>
      </div>
      <div className="navbar-links">
        <Link to="/tickets">Chamados</Link>
        <Link to="/tickets/new">Abrir Chamado</Link>
        {(user?.role === 'admin' || user?.role === 'technician') && (
          <Link to="/categories">Categorias</Link>
        )}
        {user?.role === 'admin' && <Link to="/users">Usuários</Link>}
      </div>
      <div className="navbar-user">
        <span className="user-info">
          {user?.name} <span className="role-badge">{roleLabel[user?.role || '']}</span>
        </span>
        <button onClick={handleLogout} className="btn btn-sm btn-outline">Sair</button>
      </div>
    </nav>
  );
}
