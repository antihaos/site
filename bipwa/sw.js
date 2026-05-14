const CACHE_NAME = 'bi-analytics-v3';
const STATIC_CACHE_NAME = 'bi-analytics-static-v3';
const DATA_CACHE_NAME = 'bi-analytics-data-v3';

const STATIC_ASSETS = [
  '/bipwa/',
  '/bipwa/index.html',
  '/bipwa/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/dexie@latest/dist/dexie.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/gridstack@10.1.2/dist/gridstack.min.css',
  'https://cdn.jsdelivr.net/npm/gridstack@10.1.2/dist/gridstack-all.js',
  'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование статических ресурсов');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Все ресурсы закэшированы');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Ошибка кэширования:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DATA_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker активирован');
      return self.clients.claim();
    })
  );
});

const strategies = {
  static: async (request) => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Статика из кэша:', request.url);
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.error('[SW] Ошибка загрузки статики:', error);
      if (request.mode === 'navigate') {
        return caches.match('/bipwa/index.html');
      }
      return new Response('Страница недоступна офлайн', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  },

  image: async (request) => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch((error) => {
      console.error('[SW] Ошибка загрузки изображения:', error);
    });

    return cachedResponse || fetchPromise;
  }
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.protocol === 'chrome-extension:' || url.protocol === 'indexeddb:') {
    return;
  }

  let strategy = strategies.static;
  if (request.destination === 'image' || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    strategy = strategies.image;
  }

  event.respondWith(strategy(request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
    );
  }
});