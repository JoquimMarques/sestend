const BACKEND_URL = window.SISTEND_CONFIG ? window.SISTEND_CONFIG.BACKEND_URL : "http://localhost:8000";

function carregarRelatorio() {
    fetch(`${BACKEND_URL}/api/relatorio/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                renderizarTabela(data.dados);
                document.getElementById('total-count').innerText = `Total de registros: ${data.dados.length}`;
            }
        })
        .catch(err => console.error("Erro ao carregar relatório:", err));
}

function renderizarTabela(leituras) {
    const tbody = document.querySelector('#relatorio-table tbody');
    tbody.innerHTML = '';
    
    if (leituras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-dim);">Nenhum registro encontrado no relatório.</td></tr>';
        return;
    }

    leituras.forEach(l => {
        const data = new Date(l.data_hora).toLocaleString('pt-BR');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: var(--primary-color);">${l.equipamento}</td>
            <td>${l.tensao.toFixed(1)} <small style="color: var(--text-dim);">V</small></td>
            <td>${l.corrente.toFixed(3)} <small style="color: var(--text-dim);">A</small></td>
            <td>${l.potencia.toFixed(1)} <small style="color: var(--text-dim);">W</small></td>
            <td>${l.frequencia.toFixed(1)} <small style="color: var(--text-dim);">Hz</small></td>
            <td style="font-weight: 500;">${l.energia.toFixed(4)} <small style="color: var(--text-dim);">kWh</small></td>
            <td style="color: var(--text-dim); font-size: 0.8rem;">${data}</td>
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

window.limparRelatorio = function() {
    if (confirm('Tem certeza que deseja apagar TODOS os registros do relatório?')) {
        // Implementar limpeza via API se necessário
        alert("Função de limpeza em desenvolvimento para API");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
    
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
