import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RoleProtectedRoute component that handles all types of access control:
 * - 'admin': Only accessible to users with admin role
 * - 'user': Accessible to any logged-in user
 * - 'guest': Accessible to non-logged-in users
 * - undefined: Accessible to everyone (public route)
 */
function RoleProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Handle guest-only routes (e.g., login page)
  if (requiredRole === 'guest') {
    if (isAuthenticated) {
      return <Navigate to="/home" replace />;
    }
    return children;
  }

  // Handle protected routes (admin and user)
  if (requiredRole) {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Handle admin-only routes
    if (requiredRole === 'admin' && user.role !== 'admin') {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}

export default RoleProtectedRoute; 