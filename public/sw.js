const CACHE_NAME = 'impostor-v2';
const ASSETS_TO_CACHE = [
    '/icon.webp',
    '/styles.css',
    '/js/main.js',
    '/manifest.json'
];

// Instalar Service Worker y guardar cache inicial
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Estrategia: Network First (Intentar red, si falla usar cache)
// Esto es ideal para juegos multiplayer donde queremos el contenido más fresco siempre.
self.addEventListener('fetch', (event) => {
    // IGNORAR peticiones de Socket.IO, API y Admin
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/socket.io/') ||
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/admin')) {
        return;
    }

    // Solo interceptar GET requests de archivos estáticos
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
