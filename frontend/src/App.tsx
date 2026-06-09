import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import NewTicketPage from './pages/NewTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={
            <PrivateRoute>
              <Layout><DashboardPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/tickets" element={
            <PrivateRoute>
              <Layout><TicketsPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/tickets/new" element={
            <PrivateRoute>
              <Layout><NewTicketPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/tickets/:id" element={
            <PrivateRoute>
              <Layout><TicketDetailPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/categories" element={
            <PrivateRoute roles={['admin', 'technician']}>
              <Layout><CategoriesPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/users" element={
            <PrivateRoute roles={['admin']}>
              <Layout><UsersPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
