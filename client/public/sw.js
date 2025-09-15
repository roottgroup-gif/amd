// MapEstate Service Worker
// Provides caching strategies and offline functionality

const CACHE_NAME = 'mapestate-v1';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Resources to cache immediately when SW installs
const STATIC_CACHE_URLS = [
  '/',
  '/properties',
  '/favorites',
  '/offline.html', // Offline fallback page
  '/manifest.json',
  // Common assets
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints to cache with network-first strategy
// Exclude sensitive endpoints like auth/me to avoid caching stale user data
const API_CACHE_PATTERNS = [
  /\/api\/properties/,
  /\/api\/favorites/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching static resources...');
        
        // Cache static resources (exclude cross-origin resources that might fail)
        const localResources = STATIC_CACHE_URLS.filter(url => 
          url.startsWith('/') || url.includes(self.location.origin)
        );
        
        // Ensure offline.html is explicitly cached
        try {
          await cache.add('/offline.html');
          console.log('[SW] Offline fallback page cached successfully');
        } catch (error) {
          console.warn('[SW] Failed to cache offline page:', error);
        }
        
        // Cache other static resources, failing gracefully
        for (const url of localResources) {
          if (url !== '/offline.html') { // Already cached above
            try {
              await cache.add(url);
            } catch (error) {
              console.warn('[SW] Failed to cache resource:', url, error);
            }
          }
        }
        
        console.log('[SW] Static resources cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip SSE (Server-Sent Events) requests - these must not be cached or intercepted
  if (isSSERequest(request, url)) {
    console.log('[SW] Bypassing SSE request:', url.pathname);
    return; // Let the browser handle SSE requests directly
  }

  // Handle different resource types with appropriate strategies
  if (isApiRequest(url)) {
    // API requests: Network-first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    // Static assets: Cache-first with network fallback
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    // Navigation requests: Network-first with offline fallback
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Other requests: Network-first
    event.respondWith(handleNetworkFirst(request));
  }
});

// Check if request is for SSE (Server-Sent Events)
function isSSERequest(request, url) {
  // Check if the accept header indicates SSE
  const acceptHeader = request.headers.get('accept');
  if (acceptHeader && acceptHeader.includes('text/event-stream')) {
    return true;
  }
  
  // Check if the URL is for SSE stream endpoints
  return url.pathname.includes('/stream') || url.pathname.endsWith('/events');
}

// Check if request is for API
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for static assets
function isStaticAsset(url) {
  const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i;
  return staticExtensions.test(url.pathname) || 
         url.hostname === 'fonts.googleapis.com' ||
         url.hostname === 'fonts.gstatic.com' ||
         url.hostname === 'unpkg.com' ||
         url.hostname === 'cdnjs.cloudflare.com';
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cacheKey = `${request.url}${request.method}`;
  
  try {
    // Try network first
    console.log('[SW] API request (network-first):', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      const responseClone = response.clone();
      
      // Add timestamp for cache expiry
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(cacheKey, responseWithTimestamp);
      console.log('[SW] Cached API response:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API:', request.url);
    
    // Network failed, try cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt && (Date.now() - parseInt(cachedAt)) < CACHE_EXPIRY) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      } else {
        // Cache expired, delete it
        cache.delete(cacheKey);
      }
    }
    
    // No valid cache, return error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }), 
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    console.log('[SW] Static asset (cache-first):', request.url);
    
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving static asset from cache:', request.url);
      
      // Serve from cache and update in background
      fetch(request)
        .then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        })
        .catch(() => {}); // Ignore background fetch errors
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
      console.log('[SW] Cached static asset:', request.url);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to serve static asset:', request.url, error);
    
    // Return a fallback response or let it fail
    return new Response('', { status: 404 });
  }
}

// Handle navigation requests with network-first and offline fallback
async function handleNavigationRequest(request) {
  try {
    console.log('[SW] Navigation request (network-first):', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful page responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache:', request.url);
    
    // Try to serve from cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve offline fallback page
    console.log('[SW] Serving offline fallback page');
    const offlinePage = await cache.match('/offline.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Handle other requests with network-first strategy
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Try cache as fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('', { status: 404 });
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      console.log('[SW] Background sync triggered');
      // Handle background sync for offline actions
      event.waitUntil(handleBackgroundSync());
    }
  });
}

async function handleBackgroundSync() {
  // Implement background sync logic for offline actions
  // This could include syncing favorited properties, form submissions, etc.
  try {
    console.log('[SW] Performing background sync...');
    // Implementation would go here
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}