// ============================================
// Service Worker - Oldevide SMG SAC
// ============================================

const CACHE_NAME = 'oldevide-cache-v1';

// Recursos que se guardarán para funcionar offline
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ---------- INSTALACIÓN ----------
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caché abierto');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('[Service Worker] Recursos guardados en caché');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('[Service Worker] Error al cachear:', error);
      })
  );
});

// ---------- ACTIVACIÓN ----------
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Elimina versiones antiguas del caché
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[Service Worker] Activado y tomando control');
      return self.clients.claim();
    })
  );
});

// ---------- INTERCEPTAR PETICIONES ----------
// Estrategia: Primero caché, luego red (Cache First)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Si está en caché, se sirve desde ahí (rápido y offline)
        if (response) {
          return response;
        }
        
        // Si no está, se busca en la red
        return fetch(event.request).then(
          function(response) {
            // Valida que la respuesta sea correcta
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la respuesta y la guarda en caché para el futuro
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        ).catch(function(error) {
          console.error('[Service Worker] Error de red:', error);
        });
      })
  );
});

// ---------- NOTIFICACIONES PUSH (opcional) ----------
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Oldevide SMG',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification('Oldevide SMG', options)
  );
});