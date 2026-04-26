// Sistema de Autenticação para Apresentação
(function() {
    const user = JSON.parse(localStorage.getItem('sistend_user'));
    
    // Se não estiver logado e não estiver na página de login/cadastro, redireciona
    const path = window.location.pathname;
    if (!user && !path.includes('login.html') && !path.includes('cadastro.html')) {
        window.location.href = 'login.html';
        return;
    }

    if (user) {
        document.addEventListener('DOMContentLoaded', () => {
            // Atualiza Perfil na Sidebar (se existir)
            const profileName = document.querySelector('.profile-name');
            const profileRole = document.querySelector('.profile-role');
            const profileAvatar = document.querySelector('.profile-avatar');
            
            if (profileName) profileName.innerText = user.name;
            if (profileRole) profileRole.innerText = user.role;
            if (profileAvatar) profileAvatar.innerText = user.name.charAt(0).toUpperCase();
        });

        // BLOQUEIO TOTAL PARA "USUÁRIO" (SÓ PODE VER E LIGAR/DESLIGAR)
        if (user.type !== 'admin') {
            // Aplica no <html> pois o <body> pode não estar pronto ainda no <head>
            document.documentElement.classList.add('user-mode');
            
            // 1. CSS de Bloqueio Instantâneo (Ultra Agressivo)
            const style = document.createElement('style');
            style.innerHTML = `
                /* Esconde tudo que é de ADM usando a classe no HTML */
                html.user-mode .btn-icon-action.delete, 
                html.user-mode .btn-load-more.admin-only,
                html.user-mode .btn-primary:has([data-lucide="plus-circle"]),
                html.user-mode button:has([data-lucide="plus-circle"]),
                html.user-mode button:has([data-lucide="trash-2"]),
                html.user-mode button:has([data-lucide="edit"]),
                html.user-mode [onclick*="limpar"],
                html.user-mode [onclick*="deletar"],
                html.user-mode [onclick*="adicionar"],
                html.user-mode [onclick*="editar"],
                html.user-mode [onclick*="apagar"],
                html.user-mode [class*="delete"],
                html.user-mode [class*="edit-btn"],
                html.user-mode [id*="delete"],
                html.user-mode a[href*="base_dados"],
                html.user-mode a[href*="configuracoes"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `;
            document.head.appendChild(style);

            // 2. Varredura JavaScript "Varredora" (Roda assim que o DOM carregar)
            document.addEventListener('DOMContentLoaded', () => {
                const limparInterface = () => {
                    document.querySelectorAll('button, a, i, span').forEach(el => {
                        const texto = (el.innerText || "").toLowerCase();
                        const htmlContent = (el.innerHTML || "").toLowerCase();
                        const onclick = el.getAttribute('onclick') || "";
                        
                        const listaNegra = ['deletar', 'limpar', 'adicionar', 'editar', 'apagar', 'trash', 'plus', 'database', 'settings'];
                        
                        if (onclick.includes('toggleDevice') || htmlContent.includes('power')) {
                            return; 
                        }

                        const deveRemover = listaNegra.some(termo => 
                            texto.includes(termo) || 
                            htmlContent.includes(termo) || 
                            onclick.toLowerCase().includes(termo)
                        );

                        if (deveRemover) {
                            el.remove();
                        }
                    });

                    document.querySelectorAll('.nav-item').forEach(item => {
                        const t = item.innerText.toLowerCase();
                        if (t.includes('base de dados') || t.includes('configurações')) {
                            item.remove();
                        }
                    });
                };

                limparInterface();
                const sweepInterval = setInterval(limparInterface, 100);
                setTimeout(() => clearInterval(sweepInterval), 5000);
            });
        }
    }
})();

// Função de Logout Global
window.fazerLogout = function() {
    localStorage.removeItem('sistend_user');
    window.location.href = 'login.html';
}

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(sidebar) sidebar.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
};

window.closeSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.classList.remove('active');
};
