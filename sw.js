/* ============================================================
   Service Worker · Portal de Evaluación - Tecnología 4º ESO
   (antes: service-worker.js)
   ============================================================
   APP_VERSION es la única fuente de verdad de la versión de la
   aplicación: alimenta el nombre de la caché y el chip de versión
   que muestra index.html (mensaje GET_VERSION o, como respaldo,
   la lectura de esta constante directamente desde sw.js).

   IMPORTANTE: para publicar cambios en la app, sube APP_VERSION
   un número (4 -> 5 -> 6...). Así se crea una caché nueva con los
   archivos actualizados y se borra automáticamente la anterior.
   ============================================================ */
const APP_VERSION = '2.5';
const CACHE_NAME = `eval-compesptec4-v${APP_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js', // se cachea para que el chip de versión funcione sin conexión
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
        console.log(`[${CACHE_NAME}] Archivos cacheados correctamente`);
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
    Promise.all([
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME && esCachePropia(key)) {
            return caches.delete(key);
          }
        }));
      }),
      // Tomar el control de las pestañas abiertas ya en la primera visita,
      // para que el chip de versión pueda leer APP_VERSION sin recargar.
      self.clients.claim()
    ])
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

// Chip de versión: responder a la página con la versión de la app.
// La página pregunta con { type: 'GET_VERSION' } y se responde por el
// mismo MessageChannel (respuesta directa, sin broadcast a otras apps).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    const reply = { type: 'VERSION', version: APP_VERSION };
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(reply);
    } else if (event.source) {
      event.source.postMessage(reply);
    }
  }
});
