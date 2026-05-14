import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route element and redirects to /login if the user is not
 * authenticated. Preserves the original URL so we can redirect back
 * after a successful login.
 *
 * While the initial auth check (fetchMe) is in progress, renders a
 * full-screen loading spinner so we never flash a redirect.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Loading arena...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
