import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from '../lib/authApi';
import type { AuthSession } from '../types/AuthSession';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  if (!session?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => session.roles.includes(role));
    if (!hasRole) {
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
