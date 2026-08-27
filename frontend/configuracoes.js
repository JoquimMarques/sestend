const BACKEND_URL = window.SISTEND_CONFIG ? window.SISTEND_CONFIG.BACKEND_URL : "http://localhost:8000";

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
    if (container) container.innerHTML = '';
    
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
        if (container) container.appendChild(card);
    });

    preencherSeletorSimulacao(dispositivos);
}

function preencherSeletorSimulacao(dispositivos) {
    const select = document.getElementById('sim-device');
    if (!select) return;
    select.innerHTML = '';
    if (!dispositivos || dispositivos.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Nenhum dispositivo disponível';
        select.appendChild(opt);
        return;
    }
    dispositivos.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.numero_sensor;
        opt.textContent = `Sensor ${e.numero_sensor} - ${e.nome}`;
        select.appendChild(opt);
    });
}

function avisoSimulacao(mensagem, ok) {
    const el = document.getElementById('sim-result');
    if (!el) return;
    el.className = 'sim-result ' + (ok ? 'ok' : 'erro');
    el.textContent = mensagem;
    el.style.display = 'block';
}

// Envia um POST para a API receber-dados/ com uma leitura simulada (is_mock).
// Reutiliza a API existente, igual ao ESP32 real.
function enviarSimulacao(payload, mensagemSucesso) {
    const selValue = (document.getElementById('sim-device') || {}).value;
    if (!selValue) {
        avisoSimulacao('Nenhum dispositivo selecionado para a simulação.', false);
        return;
    }

    const valor = parseFloat((document.getElementById('sim-value') || {}).value);
    if (isNaN(valor) || valor <= 0) {
        avisoSimulacao('Informe um valor de simulação válido (maior que 0).', false);
        return;
    }

    const btns = document.querySelectorAll('.btn-simulacao');
    btns.forEach(b => b.disabled = true);

    const body = Object.assign({
        device_id: parseInt(selValue),
        is_mock: true
    }, payload(valor));

    fetch(`${BACKEND_URL}/api/receber-dados/`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json',
            'X-ESP32-KEY': '12345',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "sucesso") {
            avisoSimulacao(mensagemSucesso + ' Enviado com sucesso! Verifique o Dashboard e os Registros de Alarmes.', true);
        } else {
            avisoSimulacao('Erro do servidor: ' + (data.mensagem || 'resposta inválida'), false);
        }
    })
    .catch(err => {
        console.error('Erro na simulação:', err);
        avisoSimulacao('Erro de conexão com o servidor. Tente novamente.', false);
    })
    .finally(() => {
        btns.forEach(b => b.disabled = false);
    });
}

window.simularPico = function() {
    enviarSimulacao(
        (v) => ({ voltage: v, current: 5, power: 300, frequency: 50, energy: 0, pf: 1, peak_voltage: v }),
        '⚡ Pico de Tensão simulado.'
    );
}

window.simularSobrecorrente = function() {
    enviarSimulacao(
        (v) => ({ voltage: 230, current: v, power: 400, frequency: 50, energy: 0, pf: 1, peak_voltage: 230 }),
        '🔥 Sobrecorrente simulada.'
    );
}

window.simularSobreconsumo = function() {
    enviarSimulacao(
        (v) => ({ voltage: 230, current: 5, power: v, frequency: 50, energy: 0, pf: 1, peak_voltage: 230 }),
        '📈 Sobreconsumo de Energia simulado.'
    );
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
    carregarConfiguracoes();
});
