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
