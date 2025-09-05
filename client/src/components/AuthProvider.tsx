import { ReactNode } from 'react';
import { useAuthProvider, AuthContext_Export } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthProvider();
  
  return (
    <AuthContext_Export.Provider value={auth}>
      {children}
    </AuthContext_Export.Provider>
  );
}