import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StaffRole } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: StaffRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['owner', 'receptionist', 'barber'],
}) => {
  const { user, role, isStaff, loading, logout } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen bg-all1-navy flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-all1-deep p-8 rounded-card border border-all1-cobalt/20 space-y-4">
          <Skeleton className="h-8 w-48 bg-all1-cobalt/20" />
          <Skeleton className="h-4 w-full bg-all1-cobalt/20" />
          <Skeleton className="h-4 w-3/4 bg-all1-cobalt/20" />
        </div>
      </div>
    );
  }

  // If not logged in at all, redirect to login page
  if (!user && !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in via Google but email is NOT allowlisted in staff table
  if (user && !isStaff) {
    return (
      <div className="min-h-screen bg-all1-navy text-white flex items-center justify-center p-4">
        <div className="bg-all1-deep rounded-card max-w-md w-full p-8 border border-all1-rose/40 text-center shadow-xl">
          <div className="w-16 h-16 bg-all1-rose/20 text-all1-rose rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-all1-fog mb-2">
            Signed in as: <strong className="text-white font-mono">{user.email}</strong>
          </p>
          <p className="text-xs text-all1-fog mb-6 font-body">
            {t('login.accessDenied')}
          </p>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 bg-all1-rose text-white font-medium py-3 rounded-btn hover:bg-opacity-90 transition tap-target"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Try Another Account</span>
          </button>
        </div>
      </div>
    );
  }

  // Role check: if user has a role that is not permitted for this route
  if (role && !allowedRoles.includes(role)) {
    // Redirect to the appropriate dashboard for their role
    if (role === 'owner') return <Navigate to="/owner" replace />;
    if (role === 'receptionist') return <Navigate to="/reception" replace />;
    if (role === 'barber') return <Navigate to="/barber/mahesh" replace />;
  }

  return <>{children}</>;
};
