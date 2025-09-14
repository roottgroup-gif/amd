// Service Worker Registration and Management
// Handles registration, updates, and communication with the service worker

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

// Check if service workers are supported
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// Register the service worker
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('[SW] Service workers are not supported in this browser');
    return null;
  }

  // Only register in production or when explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_SW_DEV) {
    console.log('[SW] Service worker registration skipped in development');
    return null;
  }

  try {
    console.log('[SW] Registering service worker...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });

    console.log('[SW] Service worker registered successfully:', registration);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('[SW] New service worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content is available
            console.log('[SW] New content available, please refresh');
            config.onUpdate?.(registration);
          } else {
            // Content is cached for offline use
            console.log('[SW] Content cached for offline use');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Handle service worker ready
    if (registration.active) {
      config.onSuccess?.(registration);
    }

    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    config.onError?.(error as Error);
    return null;
  }
}

// Unregister the service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) {
      console.log('[SW] Unregistering service worker...');
      return await registration.unregister();
    }
    return false;
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
    return false;
  }
}

// Check for service worker updates
export async function checkForUpdates(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) {
      console.log('[SW] Checking for updates...');
      await registration.update();
    }
  } catch (error) {
    console.error('[SW] Update check failed:', error);
  }
}

// Skip waiting and activate new service worker
export function skipWaiting(): void {
  if (!isServiceWorkerSupported()) {
    return;
  }

  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
}

// Get the current service worker status
export async function getServiceWorkerStatus(): Promise<{
  supported: boolean;
  registered: boolean;
  active: boolean;
  controller: boolean;
}> {
  const supported = isServiceWorkerSupported();
  
  if (!supported) {
    return { supported: false, registered: false, active: false, controller: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    return {
      supported: true,
      registered: !!registration,
      active: !!registration?.active,
      controller: !!navigator.serviceWorker.controller
    };
  } catch (error) {
    console.error('[SW] Error getting service worker status:', error);
    return { supported: true, registered: false, active: false, controller: false };
  }
}

// Listen for service worker messages
export function listenForServiceWorkerMessages(
  onMessage: (data: any) => void
): () => void {
  if (!isServiceWorkerSupported()) {
    return () => {};
  }

  const messageHandler = (event: MessageEvent) => {
    console.log('[SW] Message received from service worker:', event.data);
    onMessage(event.data);
  };

  navigator.serviceWorker.addEventListener('message', messageHandler);

  return () => {
    navigator.serviceWorker.removeEventListener('message', messageHandler);
  };
}

// Send message to service worker
export function sendMessageToServiceWorker(message: any): void {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
    console.warn('[SW] Cannot send message: service worker not available');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

// Network status helpers
export function isOnline(): boolean {
  return navigator.onLine;
}

export function addNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// Cache management helpers
export async function clearServiceWorkerCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('[SW] Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Error clearing caches:', error);
  }
}