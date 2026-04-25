const BACKEND_URL = window.BACKEND_URL || "http://localhost:8000";

function carregarBaseDados() {
    fetch(`${BACKEND_URL}/api/configuracoes/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                renderizarBaseDados(data.dados);
            }
        })
        .catch(err => console.error("Erro ao carregar base de dados:", err));
}

function renderizarBaseDados(dispositivos) {
    const container = document.getElementById('database-container');
    container.innerHTML = '';
    
    dispositivos.forEach(d => {
        const section = document.createElement('div');
        section.className = 'dispositivo-section';
        section.innerHTML = `
            <div class="section-header">
                <h2>
                    ${d.nome}
                    <span class="device-badge">Sensor #${d.numero_sensor}</span>
                </h2>
            </div>
            <div class="table-wrapper">
                <div class="empty-message">
                    <p>Nenhuma leitura disponível para este dispositivo</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

// Corrigindo o nome da variável no loop acima
function renderizarBaseDados(dispositivos) {
    const container = document.getElementById('database-container');
    container.innerHTML = '';
    
    dispositivos.forEach(d => {
        const section = document.createElement('div');
        section.className = 'dispositivo-section';
        section.innerHTML = `
            <div class="section-header">
                <h2>
                    ${d.nome}
                    <span class="device-badge">Sensor #${d.numero_sensor}</span>
                </h2>
            </div>
            <div class="table-wrapper" id="table-device-${d.numero_sensor}">
                <div class="empty-message">
                    <p>Nenhuma leitura disponível para este dispositivo</p>
                </div>
            </div>
        `;
        container.appendChild(section);
        // Tenta carregar leituras específicas se a API permitir
    });
    if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarBaseDados();
    
    // Sidebar logic
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    if (mobileToggle && sidebar && overlay) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});
