const CACHE_NAME = 'eval-compesptec4-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './icon-192.png',
  './icon-512.png'
  // Nota: Las librerías externas (Tailwind, FontAwesome) requieren conexión
  // a menos que las descargues y las sirvas localmente.
];

// Instalación del Service Worker y cacheo de recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Archivos cacheados correctamente');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activación y limpieza de caches antiguas
// Solo borrar cachés de esta propia app (por prefijo): no tocar las cachés
// del portal ni las de otras apps alojadas en subcarpetas del mismo dominio.
const esCachePropia = (c) => c.startsWith('eval-compesptec4-');

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && esCachePropia(key)) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Intercepción de peticiones (Estrategia: Cache primero, luego red)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en caché, lo devuelve, si no, lo busca en la red
        return response || fetch(event.request);
      })
  );
});
