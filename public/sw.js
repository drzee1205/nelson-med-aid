const CACHE_NAME = 'nelson-gpt-v1.0.0';
const STATIC_CACHE_NAME = 'nelson-gpt-static-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first for API calls, cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls - network first with fallback
  if (url.pathname.includes('/functions/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response for caching
          const responseClone = response.clone();
          
          // Cache successful API responses for offline fallback
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache for offline support
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Return offline message for API calls
              return new Response(
                JSON.stringify({
                  error: 'Offline - Please check your internet connection',
                  offline: true
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network and cache
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw new Error('Network error and no cache available');
          });
      })
  );
});

// Background sync for queued medical queries
self.addEventListener('sync', (event) => {
  if (event.tag === 'medical-query-sync') {
    console.log('Background syncing medical queries...');
    event.waitUntil(syncMedicalQueries());
  }
});

// Push notifications for urgent medical alerts
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss', 
        title: 'Dismiss'
      }
    ],
    requireInteraction: data.urgent || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  const { notification, action } = event;
  
  notification.close();

  if (action === 'view') {
    event.waitUntil(
      clients.openWindow(notification.data?.url || '/')
    );
  }
});

// Helper function to sync queued medical queries
async function syncMedicalQueries() {
  try {
    // Get queued queries from IndexedDB
    const queries = await getQueuedQueries();
    
    for (const query of queries) {
      try {
        // Attempt to send query to server
        const response = await fetch('/api/nelson-gpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query)
        });

        if (response.ok) {
          // Remove from queue on success
          await removeQueuedQuery(query.id);
          console.log('Synced queued query:', query.id);
        }
      } catch (error) {
        console.error('Failed to sync query:', query.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getQueuedQueries() {
  // Implementation would use IndexedDB to store/retrieve queued queries
  return [];
}

async function removeQueuedQuery(queryId) {
  // Implementation would remove query from IndexedDB
  console.log('Removing queued query:', queryId);
}