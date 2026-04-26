const BACKEND_URL = window.SISTEND_CONFIG ? window.SISTEND_CONFIG.BACKEND_URL : "http://localhost:8000";

let dadosCompletos = [];
let registrosVisiveis = 8;

function carregarRelatorio() {
    fetch(`${BACKEND_URL}/api/relatorio/`, { credentials: 'omit' })
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso") {
                dadosCompletos = data.dados;
                renderizarTabela();
                document.getElementById('total-count').innerText = `Total de registros: ${dadosCompletos.length}`;
            }
        })
        .catch(err => console.error("Erro ao carregar relatório:", err));
}

function renderizarTabela() {
    const tbody = document.querySelector('#relatorio-table tbody');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const btnVerMais = document.getElementById('btn-ver-mais');
    
    tbody.innerHTML = '';
    
    if (dadosCompletos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 4rem; color: var(--text-dim); font-size: 1.1rem;">Nenhum registro encontrado no relatório.</td></tr>';
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }

    const leiturasParaMostrar = dadosCompletos.slice(0, registrosVisiveis);

    leiturasParaMostrar.forEach(l => {
        const data = new Date(l.data_hora).toLocaleString('pt-BR');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
                <i data-lucide="monitor" style="width: 14px; height: 14px; opacity: 0.5;"></i>
                ${l.equipamento}
            </td>
            <td>${l.tensao.toFixed(1)} <small style="color: var(--text-dim);">V</small></td>
            <td>${l.corrente.toFixed(3)} <small style="color: var(--text-dim);">A</small></td>
            <td>${l.potencia.toFixed(1)} <small style="color: var(--text-dim);">W</small></td>
            <td>${l.frequencia.toFixed(1)} <small style="color: var(--text-dim);">Hz</small></td>
            <td style="font-weight: 500;">${l.energia.toFixed(4)} <small style="color: var(--text-dim);">kWh</small></td>
            <td style="color: var(--text-dim); font-size: 0.8rem;">${data}</td>
            <td style="text-align: center;">
                <button onclick="deletarLeitura(${l.id}, this)" class="btn-icon-action delete" title="Excluir Registro" style="padding: 6px; border-radius: 8px;">
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
    if (confirm('Deseja realmente excluir este registro?')) {
        // Efeito instantâneo para a apresentação
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
            if (!response.ok) console.warn("Erro silencioso no backend");
            // Não recarrega para não "reaparecer" o item se o backend falhar na demo
        })
        .catch(err => console.error("Erro de rede:", err));
    }
}

window.limparRelatorio = function() {
    if (confirm('Tem certeza que deseja apagar TODOS os registros do relatório?')) {
        document.querySelector('#relatorio-table tbody').innerHTML = '';
        document.getElementById('pagination-container').style.display = 'none';
        
        fetch(`${BACKEND_URL}/relatorio/limpar/`, {
            method: 'GET',
            credentials: 'omit'
        })
        .catch(err => console.error("Erro ao limpar:", err));
    }
}

// Auxiliar para CSRF se necessário
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
});

