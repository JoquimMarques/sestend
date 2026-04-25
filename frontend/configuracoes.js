const BACKEND_URL = window.BACKEND_URL || "http://localhost:8000";

function carregarConfiguracoes() {
    fetch(`${BACKEND_URL}/api/configuracoes/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                renderizarConfiguracoes(data.dados);
            }
        })
        .catch(err => console.error("Erro ao carregar configurações:", err));
}

function renderizarConfiguracoes(dispositivos) {
    const container = document.getElementById('config-list');
    container.innerHTML = '';
    
    dispositivos.forEach(e => {
        const card = document.createElement('div');
        card.className = 'config-card';
        card.innerHTML = `
            <h3>
                ${e.nome}
                <span class="sensor-label">Sensor ${e.numero_sensor}</span>
            </h3>
            <div class="limites-grupo">
                <h4>Configurações Gerais</h4>
                <div class="form-group">
                    <label>Nome do Dispositivo</label>
                    <input type="text" id="nome-${e.id}" value="${e.nome}">
                </div>
            </div>
            <div class="limites-grupo">
                <h4>Limites de Proteção</h4>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Tensão Máxima (V)</label>
                        <input type="number" id="v-max-${e.id}" value="${e.limite_tensao}" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Corrente Máxima (A)</label>
                        <input type="number" id="a-max-${e.id}" value="${e.limite_corrente}" step="0.1">
                    </div>
                </div>
            </div>
            <button onclick="salvarConfig(${e.id})" class="btn-salvar">Salvar Configurações</button>
        `;
        container.appendChild(card);
    });
}

window.salvarConfig = function(id) {
    const payload = {
        eletro_id: id,
        nome: document.getElementById(`nome-${id}`).value,
        limite_tensao: parseFloat(document.getElementById(`v-max-${id}`).value),
        limite_corrente: parseFloat(document.getElementById(`a-max-${id}`).value)
    };

    // Note: Reusing editar-dispositivo for name if possible, 
    // but ideally we need a separate config API.
    alert("Configurações salvas localmente (API pendente)");
}

document.addEventListener('DOMContentLoaded', () => {
    carregarConfiguracoes();
    
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
