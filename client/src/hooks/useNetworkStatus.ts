import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  downlink?: number;
  rtt?: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    downlink: undefined,
    rtt: undefined,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      let isSlowConnection = false;
      let connectionType = 'unknown';
      let downlink: number | undefined;
      let rtt: number | undefined;

      // Check network connection details if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connectionType = connection.effectiveType || connection.type || 'unknown';
        downlink = connection.downlink;
        rtt = connection.rtt;

        // Consider connection slow if:
        // - effective type is 'slow-2g' or '2g'
        // - downlink is less than 1.5 Mbps
        // - round trip time is greater than 400ms
        isSlowConnection = 
          connectionType === 'slow-2g' || 
          connectionType === '2g' ||
          (downlink && downlink < 1.5) ||
          (rtt && rtt > 400);
      }

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType,
        downlink,
        rtt,
      });
    };

    // Initial check
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}