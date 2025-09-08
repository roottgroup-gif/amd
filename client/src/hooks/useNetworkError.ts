import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from './useNetworkStatus';

export function useNetworkError() {
  const { toast } = useToast();
  const { isOnline, isSlowConnection } = useNetworkStatus();

  useEffect(() => {
    const handleFetchError = (event: Event) => {
      const error = (event as any).reason || (event as any).error;
      
      if (!isOnline) {
        toast({
          title: 'Connection Lost',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive',
        });
      } else if (isSlowConnection && error?.name === 'TimeoutError') {
        toast({
          title: 'Slow Connection',
          description: 'Request timed out. Your connection appears to be slow.',
          variant: 'destructive',
        });
      } else if (error?.message?.includes('fetch')) {
        toast({
          title: 'Network Error',
          description: 'Failed to connect to server. Please try again.',
          variant: 'destructive',
        });
      }
    };

    // Listen for unhandled promise rejections (common with fetch failures)
    window.addEventListener('unhandledrejection', handleFetchError);

    return () => {
      window.removeEventListener('unhandledrejection', handleFetchError);
    };
  }, [isOnline, isSlowConnection, toast]);
}