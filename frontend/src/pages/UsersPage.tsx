import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../api/axios';
import type { User, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const roleLabel: Record<UserRole, string> = {
  user:       'Usuário',
  technician: 'Técnico',
  admin:      'Admin',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  function load() {
    api.get('/users')
      .then((r) => setUsers(r.data))
      .catch(() => setError('Erro ao carregar usuários.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId: string, role: UserRole) {
    if (userId === currentUser?.id) {
      setError('Não é possível alterar o próprio perfil.');
      return;
    }
    setChangingRole(userId);
    setError('');
    try {
      await api.put(`/users/${userId}`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.error : undefined;
      setError(msg || 'Erro ao alterar perfil.');
    } finally {
      setChangingRole(null);
    }
  }

  async function handleDelete(userId: string) {
    setError('');
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.error : undefined;
      setError(msg || 'Erro ao excluir.');
    } finally {
      setPendingDelete(null);
    }
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Usuários</h1>
        <span>{users.length} usuários cadastrados</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="role-select"
                    disabled={u.id === currentUser?.id || changingRole === u.id}
                  >
                    {(Object.entries(roleLabel) as [UserRole, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                  {pendingDelete === u.id ? (
                    <span className="confirm-inline">
                      Excluir?{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Sim</button>
                      {' '}
                      <button className="btn btn-sm btn-outline" onClick={() => setPendingDelete(null)}>Não</button>
                    </span>
                  ) : (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => setPendingDelete(u.id)}
                      disabled={u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? 'Não é possível excluir a própria conta' : undefined}
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
