// Configurações globais do SistEnd
const CONFIG = {
    // URL do Backend no Render (exemplo: https://sestend-back.onrender.com)
    // Para teste local, use http://localhost:8000
    BACKEND_URL: "https://sestendy.onrender.com",
    
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
// Um cronjob externo (uptime monitor) mantém a instância da
// Render acordada a cada 5 minutos. Este ping do navegador é
// apenas um reforço leve, espaçado em 20 minutos, para não
// sobrecarregar o servidor.
// ============================================================
function enviarKeepAlive() {
    try {
        fetch(CONFIG.BACKEND_URL + "/api/keep-alive/", {
            method: 'GET',
            credentials: 'omit'
        }).catch(function() { /* silencioso: ignora erros de rede temporários */ });
    } catch (e) { /* ignora */ }
}
// Envia um ping imediatamente e depois a cada 20 minutos
enviarKeepAlive();
setInterval(enviarKeepAlive, 20 * 60 * 1000);
