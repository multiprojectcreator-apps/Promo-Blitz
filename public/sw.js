const CACHE_NAME = 'promo-blitz-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&amp;family=Space+Grotesk:wght@400;500;700;900&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap'
];

// Install Event: Pre-cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🔌 [Service Worker] Pre-caching core app shell assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('⚠️ [Service Worker] Non-blocking caching issue:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 [Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Intelligent offline caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests (e.g., POST payments, user mutations)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Bypass API requests with Network-Only or Network-First strategies
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API reads for offline reference (e.g. active raffle details, sponsors)
          if (response.status === 200 && url.pathname.includes('/sponsors') || url.pathname.includes('/config')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails for API, check if we have a cached version
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return custom JSON indicating offline mode
            return new Response(
              JSON.stringify({
                error: true,
                message: 'No hay conexión a Internet. Estas funciones no están disponibles sin red.',
                offline: true
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // 3. SPA Navigation fallback: serve index.html for page loads if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 4. Stale-While-Revalidate Strategy for static files (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {/* Ignore background fetch errors */});

        return cachedResponse;
      }

      // Fallback to network
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
