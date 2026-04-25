const BACKEND_URL = window.SISTEND_CONFIG ? window.SISTEND_CONFIG.BACKEND_URL : "http://localhost:8000";

function carregarConsumo() {
    fetch(`${BACKEND_URL}/api/relatorio/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                const leiturasConsumo = data.dados.filter(l => l.energia > 0);
                renderizarTabela(leiturasConsumo);
            }
        })
        .catch(err => console.error("Erro ao carregar consumo:", err));
}

function renderizarTabela(leituras) {
    const tbody = document.querySelector('#consumo-table tbody');
    tbody.innerHTML = '';
    
    if (leituras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 2rem;">Nenhum registro de consumo encontrado.</td></tr>';
        return;
    }

    leituras.forEach(l => {
        const data = new Date(l.data_hora).toLocaleString('pt-BR');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${data}</td>
            <td style="font-weight: 500; color: var(--text-light);">${l.equipamento}</td>
            <td>${l.tensao.toFixed(1)}V</td>
            <td>
                <span style="color: var(--primary-color); font-weight: bold; font-family: 'JetBrains Mono', monospace;">
                    ${l.energia.toFixed(4)} kWh
                </span>
            </td>
            <td style="text-align: center;">
                <button onclick="deletarLeitura(${l.id})" class="btn-icon-action delete" title="Excluir Registro">
                    <i data-lucide="x-circle"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

window.limparConsumo = function() {
    if (confirm('Tem certeza que deseja apagar TODOS os registros de consumo?')) {
        alert("Função pendente na API");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarConsumo();
    
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
