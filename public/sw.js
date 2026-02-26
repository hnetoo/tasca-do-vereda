const CACHE_NAME = 'tasca-vereda-v1';
const STATIC_CACHE = 'tasca-static-v1';
const DYNAMIC_CACHE = 'tasca-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/_next/static/media/',
  '/logo.png',
  '/icons/',
];

// API routes that should be cached
const CACHEABLE_ROUTES = [
  '/api/products',
  '/api/categories',
  '/api/orders',
  '/api/menu',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }

          // If not in cache, try network
          return fetch(request)
            .then((networkResponse) => {
              // Cache successful responses
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => {
              // Return offline fallback
              return new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }

  // Handle API routes
  if (isAPIRoute(request.url)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Return cached response if available and not too old
          if (response && !isResponseTooOld(response)) {
            return response;
          }

          // Try network first for API routes
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => {
              // Return cached response if available
              return caches.match(request)
                .then((cachedResponse) => {
                  if (cachedResponse) {
                    return cachedResponse;
                  }
                  
                  // Return offline response
                  return new Response(JSON.stringify({
                    error: 'Offline',
                    message: 'No connection available'
                  }), {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });
                });
            });
        })
    );
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }

          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => {
              // Return cached index page
              return caches.match('/');
            });
        })
    );
    return;
  }

  // Default: try network first, then cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Helper functions
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('/_next/static/') ||
         url.includes('/icons/') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.jpeg') ||
         url.endsWith('.svg') ||
         url.endsWith('.css') ||
         url.endsWith('.js');
}

function isAPIRoute(url) {
  return CACHEABLE_ROUTES.some(route => url.includes(route)) ||
         url.includes('/api/');
}

function isResponseTooOld(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  return (now.getTime() - responseDate.getTime()) > maxAge;
}

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync pending data
      syncPendingData()
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data?.text() || 'Nova notificação',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: event.data?.json() || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Tasca Do VEREDA', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default: open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync pending data
async function syncPendingData() {
  try {
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    for (const item of pendingData) {
      try {
        // Send to server
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        });

        if (response.ok) {
          // Remove from pending data
          await removePendingData(item.id);
        }
      } catch (error) {
        console.error('Failed to sync item:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// IndexedDB helpers for pending data
async function getPendingData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tasca-pending-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending'], 'readonly');
      const store = transaction.objectStore('pending');
      const getRequest = store.getAll();
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => resolve(getRequest.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tasca-pending-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending'], 'readwrite');
      const store = transaction.objectStore('pending');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    };
  });
}
