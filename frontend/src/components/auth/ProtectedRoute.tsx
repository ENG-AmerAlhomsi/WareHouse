import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  excludedRoles?: string[];
}

// Helper functions for role checking
const hasRole = (user: any, role: string): boolean => {
  if (!user?.roles) return false;
  
  // Case-insensitive check
  return user.roles.some((r: string) => 
    r.toLowerCase() === role.toLowerCase() || 
    r.toLowerCase().includes(role.toLowerCase())
  );
};

const hasAnyRole = (user: any, roles: string[]): boolean => {
  if (!roles || roles.length === 0) return true;
  return roles.some(role => hasRole(user, role));
};

const isAdmin = (user: any): boolean => {
  return hasRole(user, 'admin');
};

const ProtectedRoute = ({ children, requiredRoles = [], excludedRoles = [] }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Still loading, show nothing or a loading indicator
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Check if user is authenticated - should no longer happen with AuthGuard
  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
  }

  // Check if user has any excluded role
  if (excludedRoles.length > 0 && hasAnyRole(user, excludedRoles)) {
    return <Navigate to="/" replace />;
  }

  // Admins can access everything UNLESS specifically excluded above
  if (isAdmin(user)) {
    return <>{children}</>;
  }

  // If there are required roles and user doesn't have any of them
  if (requiredRoles.length > 0 && !hasAnyRole(user, requiredRoles)) {
    // For unauthorized access, redirect to home which will then
    // redirect to the appropriate page based on user role
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute; 