const BACKEND_URL = window.SISTEND_CONFIG ? window.SISTEND_CONFIG.BACKEND_URL : "http://localhost:8000";

let registrosVisiveis = 8;
let dadosCompletos = [];

function carregarConsumo() {
    fetch(`${BACKEND_URL}/api/relatorio/`, { credentials: 'omit' })
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                dadosCompletos = data.dados.filter(l => l.energia > 0);
                renderizarTabela();
            }
        })
        .catch(err => console.error("Erro ao carregar consumo:", err));
}

function renderizarTabela() {
    const tbody = document.querySelector('#consumo-table tbody');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const btnVerMais = document.getElementById('btn-ver-mais');

    tbody.innerHTML = '';
    
    if (dadosCompletos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 2rem;">Nenhum registro de consumo encontrado.</td></tr>';
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }

    const leiturasMostrar = dadosCompletos.slice(0, registrosVisiveis);

    leiturasMostrar.forEach(l => {
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
                <button onclick="deletarLeitura(${l.id}, this)" class="btn-icon-action delete" title="Excluir Registro">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (paginationContainer) {
        paginationContainer.style.display = 'flex';
        const total = dadosCompletos.length;
        const visiveis = Math.min(registrosVisiveis, total);
        paginationInfo.innerText = `Visualizando ${visiveis} registros (Total de ${total} registros no banco)`;
        
        if (registrosVisiveis >= total) {
            btnVerMais.style.display = 'none';
        } else {
            btnVerMais.style.display = 'flex';
        }
    }

    if (window.lucide) lucide.createIcons();
}

window.verMais = function() {
    registrosVisiveis += 8;
    renderizarTabela();
}

window.deletarLeitura = function(id, btn) {
    if (confirm('Deseja realmente excluir este registro de consumo?')) {
        // Efeito instantâneo
        const row = btn.closest('tr');
        if (row) {
            row.style.transition = 'all 0.3s';
            row.style.opacity = '0';
            setTimeout(() => row.style.display = 'none', 300);
        }

        fetch(`${BACKEND_URL}/relatorio/deletar/${id}/`, {
            method: 'GET',
            credentials: 'omit'
        })
        .then(response => {
            if (!response.ok) console.warn("Erro silencioso");
        })
        .catch(err => console.error("Erro de rede:", err));
    }
}

window.limparConsumo = function() {
    if (confirm('Tem certeza que deseja apagar TODOS os registros de consumo?')) {
        document.querySelector('#consumo-table tbody').innerHTML = '';
        
        fetch(`${BACKEND_URL}/subconsumo/limpar/`, {
            method: 'GET',
            credentials: 'omit'
        })
        .catch(err => console.error("Erro ao limpar:", err));
    }
}

window.aplicarFiltros = function() {
    const sensor = document.getElementById('filter-sensor')?.value || '';
    const inicio = document.getElementById('filter-inicio')?.value || '';
    const fim = document.getElementById('filter-fim')?.value || '';

    let filtrados = dadosCompletos;

    if (sensor) filtrados = filtrados.filter(l => String(l.device_id) === sensor);
    if (inicio) filtrados = filtrados.filter(l => new Date(l.data_hora) >= new Date(inicio));
    if (fim)    filtrados = filtrados.filter(l => new Date(l.data_hora) <= new Date(fim + 'T23:59:59'));

    const countEl = document.getElementById('filter-count');
    if (countEl) countEl.innerText = `${filtrados.length} registro(s) encontrado(s)`;

    // Usa os dados filtrados para renderizar
    const backup = dadosCompletos;
    dadosCompletos = filtrados;
    registrosVisiveis = 8;
    renderizarTabela();
    dadosCompletos = backup;
}

window.limparFiltrosUI = function() {
    const s = document.getElementById('filter-sensor');
    const i = document.getElementById('filter-inicio');
    const f = document.getElementById('filter-fim');
    if (s) s.value = '';
    if (i) i.value = '';
    if (f) f.value = '';
    registrosVisiveis = 8;
    renderizarTabela();
}

window.abrirModalFiltros = function() {
    const modal = document.getElementById('modal-filtros');
    if (modal) {
        modal.classList.add('active');
        if (window.lucide) lucide.createIcons();
    }
}

window.fecharModalFiltros = function() {
    const modal = document.getElementById('modal-filtros');
    if (modal) modal.classList.remove('active');
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'modal-filtros') window.fecharModalFiltros();
});

document.addEventListener('DOMContentLoaded', () => {
    carregarConsumo();
});
