import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, Signal } from 'lucide-react';

export function NetworkStatus() {
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null; // Don't show anything when connection is good
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
      
      {isOnline && isSlowConnection && (
        <Alert className="rounded-none border-0 bg-yellow-600 text-white border-b border-yellow-700">
          <Signal className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Slow connection detected ({connectionType}). Loading may take longer than usual.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}