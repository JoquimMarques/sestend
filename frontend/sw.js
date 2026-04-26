const CACHE_NAME = 'sistend-v1';

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
    'https://unpkg.com/lucide@latest',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap'
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

    // Para arquivos da interface, Cache First, com fallback pra Network
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // Guarda em cache o que for pego na rede caso seja do mesmo site
                if (event.request.url.startsWith(self.location.origin)) {
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
        })
    );
});
