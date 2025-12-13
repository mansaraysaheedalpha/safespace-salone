// Service Worker for Push Notifications and Offline Support
const CACHE_NAME = 'safespace-v2';
const OFFLINE_CACHE = 'safespace-offline-v1';

// Static assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/topics',
  '/signup',
  '/login',
  '/counselor/login',
  '/counselor/dashboard',
  '/manifest.json',
  '/offline.html',
];

// API routes that can be cached
const CACHEABLE_API_ROUTES = [
  '/api/conversations',
  '/api/messages',
  '/api/users',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== OFFLINE_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  event.waitUntil(clients.claim());
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests - network first, cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this API route is cacheable
  const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route));

  try {
    const response = await fetch(request);

    // Cache successful GET responses for cacheable routes
    if (response.ok && isCacheable) {
      const cache = await caches.open(OFFLINE_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', url.pathname);

    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API
    return new Response(
      JSON.stringify({
        error: 'You are offline',
        offline: true,
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests - network first, cache fallback
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache');

    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Fallback offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - SafeSpace</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #0f172a;
              color: #f1f5f9;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .container { max-width: 400px; }
            h1 { color: #14b8a6; margin-bottom: 16px; }
            p { color: #94a3b8; line-height: 1.6; }
            button {
              background: #14b8a6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
            }
            button:hover { background: #0d9488; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Offline</h1>
            <p>SafeSpace needs an internet connection to load new content. Your previous conversations are still available.</p>
            <button onclick="location.reload()">Try Again</button>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Handle static asset requests - cache first, network fallback
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cache static assets
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', request.url);
    return new Response('', { status: 404 });
  }
}

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

// Sync offline messages
async function syncOfflineMessages() {
  console.log('[SW] Syncing offline messages...');

  // Notify all clients to sync their queued messages
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_MESSAGES',
      timestamp: Date.now()
    });
  });
}

// Push event - this is triggered when a push notification arrives
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'SafeSpace',
    body: 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'message',
    data: {}
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    tag: data.tag || 'message',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  // Get the target URL from notification data
  const targetUrl = event.notification.data?.url || '/counselor/dashboard';
  const userType = event.notification.data?.userType || 'counselor';

  // Determine login page based on user type
  const loginPage = userType === 'patient' ? '/login' : '/counselor/login';

  // Encode the redirect URL to pass as parameter
  const redirectParam = encodeURIComponent(targetUrl);
  const urlToOpen = `${loginPage}?redirect=${redirectParam}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls || []);
      })
    );
  }
});
