import { useEffect, useState } from 'react';
import api from '../api/axios';
import { User, UserRole } from '../types';

const roleLabel: Record<UserRole, string> = {
  user: 'Usuário',
  technician: 'Técnico',
  admin: 'Admin',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get('/users').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId: string, role: UserRole) {
    try {
      await api.put(`/users/${userId}`, { role });
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao alterar perfil.');
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await api.delete(`/users/${userId}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir.');
    }
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Usuários</h1>
        <span>{users.length} usuários cadastrados</span>
      </div>

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
                  >
                    <option value="user">Usuário</option>
                    <option value="technician">Técnico</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{new Date((u as any).created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
