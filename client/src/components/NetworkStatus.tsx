import { useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, Signal, X } from 'lucide-react';

export function NetworkStatus() {
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();
  const [isSlowConnectionDismissed, setIsSlowConnectionDismissed] = useState(false);

  if (isOnline && (!isSlowConnection || isSlowConnectionDismissed)) {
    return null; // Don't show anything when connection is good or slow connection alert is dismissed
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline && (
        <Alert className="rounded-none border-0 bg-red-600 text-white border-b border-red-700">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="font-medium">
            You're offline. Some features may not work until you reconnect.
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && isSlowConnection && !isSlowConnectionDismissed && (
        <Alert className="rounded-none border-0 bg-yellow-600 text-white border-b border-yellow-700 relative">
          <Signal className="h-4 w-4" />
          <AlertDescription className="font-medium pr-8">
            Slow connection detected ({connectionType}). Loading may take longer than usual.
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSlowConnectionDismissed(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white hover:bg-yellow-700/50"
            data-testid="close-slow-connection-alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
    </div>
  );
}