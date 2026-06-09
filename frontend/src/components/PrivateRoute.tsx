import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  roles?: UserRole[];
}

export default function PrivateRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
