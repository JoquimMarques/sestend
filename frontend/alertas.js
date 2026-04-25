const BACKEND_URL = window.BACKEND_URL || "http://localhost:8000";

function carregarAlertas() {
    const sensor = document.getElementById('filter-sensor').value;
    const tipo = document.getElementById('filter-tipo').value;
    
    let url = `${BACKEND_URL}/api/alertas/?sensor=${sensor}&tipo=${tipo}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                renderizarTabela(data.dados);
                document.getElementById('filter-count').innerText = `${data.dados.length} registro(s) encontrado(s)`;
            }
        })
        .catch(err => console.error("Erro ao carregar alertas:", err));
}

function renderizarTabela(eventos) {
    const tbody = document.querySelector('#alertas-table tbody');
    tbody.innerHTML = '';
    
    if (eventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 2rem;">Nenhum alerta encontrado.</td></tr>';
        return;
    }

    eventos.forEach(ev => {
        const data = new Date(ev.data_hora).toLocaleString('pt-BR');
        const isCritico = ev.tipo_slug === 'PICO' || ev.tipo_slug === 'SOBRECORRENTE';
        const badgeClass = isCritico ? 'critico' : 'aviso';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: 'JetBrains Mono', monospace;">${data}</td>
            <td style="font-weight: 500;">
                <i data-lucide="monitor" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; color: var(--primary-color);"></i>
                ${ev.equipamento}
            </td>
            <td>
                <span class="badge-alerta ${badgeClass}">${ev.tipo}</span>
            </td>
            <td style="font-size: 0.9rem; color: var(--text-dim); white-space: normal;">${ev.descricao}</td>
            <td style="text-align: center;">
                <button onclick="deletarAlerta(${ev.id})" class="btn-icon-action delete" title="Excluir Alerta">
                    <i data-lucide="x-circle"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

function carregarSensores() {
    fetch(`${BACKEND_URL}/api/dados-recentes/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                const select = document.getElementById('filter-sensor');
                data.dados.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.device_id;
                    opt.innerText = `Sensor ${d.device_id} - ${d.device_name}`;
                    select.appendChild(opt);
                });
            }
        });
}

window.aplicarFiltros = carregarAlertas;

window.limparFiltrosUI = function() {
    document.getElementById('filter-sensor').value = '';
    document.getElementById('filter-tipo').value = '';
    carregarAlertas();
}

window.limparAlertas = function() {
    if (confirm('Tem certeza que deseja apagar TODOS os alertas?')) {
        fetch(`${BACKEND_URL}/api/limpar-alertas/`, { method: 'POST' })
            .then(() => carregarAlertas());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarSensores();
    carregarAlertas();
    
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
