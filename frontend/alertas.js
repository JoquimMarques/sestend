const BACKEND_URL = window.SISTEND_CONFIG ? window.SISTEND_CONFIG.BACKEND_URL : "http://localhost:8000";

let registrosVisiveis = 8;
let dadosCompletos = [];

function carregarAlertas() {
    const sensor = document.getElementById('filter-sensor').value;
    const tipo = document.getElementById('filter-tipo').value;
    
    let url = `${BACKEND_URL}/api/alertas/?sensor=${sensor}&tipo=${tipo}`;
    
    fetch(url, { credentials: 'omit' })
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                dadosCompletos = data.dados;
                renderizarTabela();
                document.getElementById('filter-count').innerText = `${data.dados.length} registro(s) encontrado(s)`;
            }
        })
        .catch(err => console.error("Erro ao carregar alertas:", err));
}

function renderizarTabela() {
    const tbody = document.querySelector('#alertas-table tbody');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const btnVerMais = document.getElementById('btn-ver-mais');
    
    tbody.innerHTML = '';
    
    if (dadosCompletos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 2rem;">Nenhum alerta encontrado.</td></tr>';
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }

    const eventosMostrar = dadosCompletos.slice(0, registrosVisiveis);

    eventosMostrar.forEach(ev => {
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
                <button onclick="deletarAlerta(${ev.id}, this)" class="btn-icon-action delete" title="Excluir Alerta" style="padding: 6px; border-radius: 8px;">
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

function carregarSensores() {
    fetch(`${BACKEND_URL}/api/dados-recentes/`, { credentials: 'omit' })
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
    const ini = document.getElementById('filter-inicio');
    const fim = document.getElementById('filter-fim');
    if (ini) ini.value = '';
    if (fim) fim.value = '';
    carregarAlertas();
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

// Fecha modal ao clicar no fundo
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'modal-filtros') {
        window.fecharModalFiltros();
    }
});

window.deletarAlerta = function(id, btn) {
    if (confirm('Deseja realmente excluir este alerta?')) {
        // Efeito visual instantâneo
        const row = btn.closest('tr');
        if (row) {
            row.style.transition = 'all 0.3s';
            row.style.opacity = '0';
            setTimeout(() => row.style.display = 'none', 300);
        }

        fetch(`${BACKEND_URL}/alertas/deletar/${id}/`, {
            method: 'GET',
            credentials: 'omit'
        })
        .then(response => {
            if (!response.ok) console.warn("Erro silencioso");
        })
        .catch(err => console.error("Erro de rede:", err));
    }
}

window.limparAlertas = function() {
    if (confirm('Tem certeza que deseja apagar TODOS os alertas?')) {
        document.querySelector('#alertas-table tbody').innerHTML = '';
        
        fetch(`${BACKEND_URL}/alertas/limpar/`, {
            method: 'GET',
            credentials: 'omit'
        })
        .catch(err => console.error("Erro ao limpar:", err));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarSensores();
    carregarAlertas();
});
