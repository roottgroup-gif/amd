import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const queryClient = useQueryClient();
  
  // Check if we have session cookie before making auth request
  const hasSession = typeof document !== 'undefined' && 
    (document.cookie.includes('connect.sid=') || document.cookie.includes('session='));

  // Check if user is logged in - only fetch if we potentially have a session
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: false, // Prevent unnecessary refetches
    enabled: hasSession, // Only run if we have a session cookie
    // Use custom query function to handle 401s gracefully
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        // If 401, return null instead of throwing error
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        // Return null for network errors too to avoid noise
        console.debug('Auth check failed (expected when not logged in):', error);
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string) => {
    const response = await loginMutation.mutateAsync({ username, password });
    return response;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

export const AuthContext_Export = AuthContext;