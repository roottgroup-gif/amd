import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Loader2 } from 'lucide-react';

interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
}

export function GlobalLoader({ isLoading, message }: GlobalLoaderProps) {
  const { isSlowConnection } = useNetworkStatus();
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading && isSlowConnection) {
      // Show slow connection message after 3 seconds of loading
      timer = setTimeout(() => {
        setShowSlowMessage(true);
      }, 3000);
    } else {
      setShowSlowMessage(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, isSlowConnection]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-xl max-w-sm mx-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div>
            <div className="font-medium text-foreground">
              {message || 'Loading...'}
            </div>
            {showSlowMessage && (
              <div className="text-sm text-muted-foreground mt-1">
                Your connection is slow. This may take a while.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}