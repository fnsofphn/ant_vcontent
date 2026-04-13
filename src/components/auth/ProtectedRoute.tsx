import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { loading, session } = useAuth();

  if (session) {
    return <Outlet />;
  }

  if (loading) {
    return <div className="app-loading">Loading session...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
