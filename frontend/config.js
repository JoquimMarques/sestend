// Configurações globais do SistEnd
const CONFIG = {
    // URL do Backend no Render (exemplo: https://sestend-back.onrender.com)
    // Para teste local, use http://localhost:8000
    BACKEND_URL: "https://sistend-api.onrender.com",
    
    // Nome do utilizador padrão para exibição
    USER_NAME: "nelsonuser"
};

// Exporta para o escopo global
window.SISTEND_CONFIG = CONFIG;

// Registra o Service Worker (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.error('Falha ao registrar o ServiceWorker:', error);
            });
    });
}

// ============================================================
// KEEP-ALIVE
// Mantém o servidor (free tier da Render) acordado.
// A Render põe a instância em "sleep" após ~15min sem tráfego,
// o que causava demoras de 30-50s (cold start) no ESP32 e no app.
// Este ping leve (a cada 10min) evita que a instância adormeça
// enquanto a aplicação estiver aberta.
// ============================================================
function enviarKeepAlive() {
    try {
        fetch(CONFIG.BACKEND_URL + "/api/keep-alive/", {
            method: 'GET',
            credentials: 'omit'
        }).catch(function() { /* silencioso: ignora erros de rede temporários */ });
    } catch (e) { /* ignora */ }
}
// Envia um ping imediatamente e depois a cada 10 minutos
enviarKeepAlive();
setInterval(enviarKeepAlive, 10 * 60 * 1000);
