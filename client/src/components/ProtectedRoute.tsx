import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/admin/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Add unauthorized parameter when redirecting to admin login
        const redirectPath = fallbackPath === '/admin/login' 
          ? '/admin/login?unauthorized=true' 
          : fallbackPath;
        navigate(redirectPath);
        return;
      }

      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive',
          });
          
          // Redirect based on user role
          if (user.role === 'admin' || user.role === 'super_admin') {
            navigate('/admin/dashboard');
          } else if (user.role === 'agent') {
            navigate('/agent/dashboard');
          } else {
            navigate('/customer/dashboard');
          }
          return;
        }
      }
    }
  }, [user, isLoading, requiredRole, navigate, toast, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return null;
    }
  }

  return <>{children}</>;
}