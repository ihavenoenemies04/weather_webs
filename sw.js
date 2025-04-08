const CACHE_NAME = 'weather-app-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        const fetchRequest = e.request.clone();
        
        return fetch(fetchRequest).then(
          response => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(e.request, responseToCache);
              });
              
            return response;
          }
        ).catch(() => {
          if (e.request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
      })
  );
});