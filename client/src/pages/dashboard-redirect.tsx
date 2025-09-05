import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log('DashboardRedirect: No user, redirecting to login');
        navigate('/admin/login');
        return;
      }

      console.log('DashboardRedirect: User role:', user.role);
      
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
        case 'super_admin':
          console.log('DashboardRedirect: Redirecting admin to /admin/dashboard');
          navigate('/admin/dashboard');
          break;
        case 'agent':
          console.log('DashboardRedirect: Redirecting agent to /agent/dashboard');
          navigate('/agent/dashboard');
          break;
        case 'user':
          console.log('DashboardRedirect: Redirecting user to /customer/dashboard');
          navigate('/customer/dashboard');
          break;
        default:
          console.log('DashboardRedirect: Unknown role, redirecting to login');
          navigate('/admin/login');
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}