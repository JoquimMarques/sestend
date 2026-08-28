const CACHE_NAME = 'sistend-v5';

// Arquivos principais da interface (App Shell)
const STATIC_ASSETS = [
    './',
    './index.html',
    './login.html',
    './cadastro.html',
    './alertas.html',
    './consumo.html',
    './relatorio.html',
    './base_dados.html',
    './configuracoes.html',
    './style.css',
    './app.js',
    './auth.js',
    './config.js',
    './alertas.js',
    './consumo.js',
    './relatorio.js',
    './base_dados.js',
    './configuracoes.js',
    './manifest.json',
    './img/favicon/web-app-manifest-192x192.png',
    './img/favicon/web-app-manifest-512x512.png',
    './img/favicon/apple-touch-icon.png',
    './img/favicon/favicon.ico'
];

// Instalação do Service Worker - Pre-cache do App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Fazendo pre-cache dos arquivos estáticos');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removendo cache antigo:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Estratégia de Fetch: 
// 1. Chamadas de API (porta 8000) -> Network Only (nunca guarda em cache para ter dados reais)
// 2. Arquivos Estáticos -> Cache First, caindo para Network (assim a interface funciona offline)
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Se for uma requisição para a API do Backend, não usa cache.
    if (requestUrl.port === '8000' || requestUrl.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Para arquivos da interface, Stale-While-Revalidate:
    // serve a cache imediatamente (rápido/offline) e atualiza a cache em segundo plano,
    // assim as alterações novas chegam sozinhas no próximo load sem voltar ao CSS antigo.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const networkFetch = fetch(event.request).then((networkResponse) => {
                if (
                    event.request.url.startsWith(self.location.origin) &&
                    networkResponse &&
                    networkResponse.ok
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Se der erro na rede e não tiver cache, pode ser um html. Redireciona pra raiz ou falha.
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });

            if (cachedResponse) {
                return cachedResponse;
            }
            return networkFetch;
        })
    );
});
