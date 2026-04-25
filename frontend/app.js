let activeNotifications = {};
const BACKEND_URL = window.BACKEND_URL || "http://localhost:8000";

function renderMetric(icon, label, id, unit, color = '') {
    return `
        <div class="metric-item">
            <div class="metric-label-group">
                <i data-lucide="${icon}" class="metric-icon" ${color ? `style="color: ${color};"` : ''}></i>
                <span class="metric-label">${label}</span>
            </div>
            <div class="metric-value-group">
                <span class="metric-value" id="${id}" ${color ? `style="color: ${color}; font-weight: bold;"` : ''}>--</span>
                <span class="metric-unit">${unit}</span>
            </div>
        </div>
    `;
}

function createDeviceCard(item) {
    const id = item.device_id;
    const grid = document.getElementById('device-grid');
    if (!grid) return;

    // Remove loader se existir no primeiro carregamento
    const loader = grid.querySelector('.loader');
    if (loader && loader.parentElement) loader.parentElement.remove();

    const card = document.createElement('div');
    card.className = 'equipment-card';
    card.id = `card-${id}`;
    
    card.innerHTML = `
        <div id="alert-device-${id}" style="display: none; margin-bottom: 1rem; padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; line-height: 1.4;"></div>
        <div class="card-header">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <h3 id="nome-device-${id}">${item.device_name || 'Equipamento'}</h3>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="editarNome('${id}')" title="Editar Nome" class="btn-icon-action edit">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button id="rele-btn-${id}" 
                        onclick="toggleRele('${id}')" 
                        title="Alternar Relé"
                        class="btn-icon-action power ${item.rele ? 'on' : 'off'}">
                        <i data-lucide="power"></i>
                    </button>
                </div>
            </div>
            <span class="metric-label" id="status-device-${id}">Conectando...</span>
        </div>
        <div class="metrics-list">
            ${renderMetric('zap', 'Tensão', `v-${id}`, 'V')}
            ${renderMetric('activity', 'Corrente', `a-${id}`, 'A')}
            ${renderMetric('zap', 'Potência', `p-${id}`, 'W', 'var(--accent-blue)')}
            ${renderMetric('waves', 'Frequência', `hz-${id}`, 'Hz')}
            ${renderMetric('battery-charging', 'Consumo', `kwh-${id}`, 'kWh')}
            ${renderMetric('percent', 'Fator de Potência', `pf-${id}`, 'PF')}
            ${renderMetric('trending-up', 'Pico Máximo', `peak-${id}`, 'V', 'var(--accent-orange)')}
        </div>
    `;
    grid.appendChild(card);
    if (window.lucide) lucide.createIcons();
}

function showNotification(deviceId, alertData) {
    const alertBox = document.getElementById(`alert-device-${deviceId}`);
    if (!alertBox) return;

    const key = `${deviceId}-${alertData.tipo}`;
    
    if (activeNotifications[key]) {
        activeNotifications[key].count++;
        const badge = document.getElementById(`toast-count-${key}`);
        if (badge) {
            badge.innerText = `+${activeNotifications[key].count}`;
            badge.style.display = 'inline-block';
        }
        return;
    }

    activeNotifications[key] = { count: 1 };
    const isCritico = alertData.cor === 'red';
    
    alertBox.style.display = 'block';
    alertBox.style.background = isCritico ? 'rgba(220, 38, 38, 0.18)' : 'rgba(251, 146, 60, 0.20)';
    alertBox.style.border = `1px solid ${isCritico ? 'rgba(239, 68, 68, 0.75)' : 'rgba(251, 146, 60, 0.70)'}`;
    alertBox.style.color = isCritico ? '#fecaca' : '#ffedd5';
    alertBox.style.position = 'relative';

    alertBox.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="font-size: 1.2rem;">${alertData.simbolo || '⚠'}</div>
            <div style="flex: 1;">
                <div style="font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
                    <span>${alertData.tipo}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span id="toast-count-${key}" class="toast-counter" style="display: none; background: var(--accent-red); color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px;">+1</span>
                        <button onclick="closeNotification('${key}', ${deviceId})" style="background: none; border: none; color: inherit; cursor: pointer; padding: 2px; display: flex; align-items: center; opacity: 0.7;">
                            <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
                <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 2px;">${alertData.mensagem}</div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

window.closeNotification = function(key, deviceId) {
    const alertBox = document.getElementById(`alert-device-${deviceId}`);
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.innerHTML = '';
        delete activeNotifications[key];
    }
}

function resetCardToZero(id) {
    const statusEl = document.getElementById(`status-device-${id}`);
    if (statusEl) {
        statusEl.innerText = '○ Sem dados do Dispositivo';
        statusEl.style.color = 'var(--text-dim)';
    }
    const metrics = { 'v': 1, 'a': 2, 'p': 1, 'hz': 1, 'kwh': 2, 'pf': 2 };
    for (let m in metrics) {
        const el = document.getElementById(`${m}-${id}`);
        if (el) el.innerText = (0).toFixed(metrics[m]);
    }
    const peakEl = document.getElementById(`peak-${id}`);
    if (peakEl) peakEl.innerText = '+230.0';
    
    const releBtn = document.getElementById(`rele-btn-${id}`);
    if (releBtn) {
        releBtn.classList.remove('on');
        releBtn.classList.add('off');
    }
}

function atualizarDashboard() {
    fetch(`${BACKEND_URL}/api/dados-recentes/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso" && data.dados) {
                const idsRecebidos = data.dados.map(d => d.device_id.toString());

                data.dados.forEach(item => {
                    const id = item.device_id;
                    
                    if (!document.getElementById(`card-${id}`)) {
                        createDeviceCard(item);
                    }

                    const hasData = item.has_data === true;
                    const isReleOff = item.rele === false;

                    function setValue(elementId, value, decimals) {
                        const el = document.getElementById(elementId);
                        if (!el) return;
                        if (hasData && !isReleOff) {
                            if (typeof value === 'number' && Number.isFinite(value)) {
                                el.innerText = value.toFixed(decimals);
                            } else {
                                el.innerText = (0).toFixed(decimals);
                            }
                        } else {
                            el.innerText = (0).toFixed(decimals);
                        }
                    }

                    setValue(`v-${id}`, item.voltage, 1);
                    setValue(`a-${id}`, item.current, 2);
                    setValue(`p-${id}`, item.power, 1);
                    setValue(`hz-${id}`, item.frequency, 1);
                    setValue(`pf-${id}`, item.pf, 2);
                    const peakEl = document.getElementById(`peak-${id}`);
                    if (peakEl) {
                        if (typeof item.peak_voltage === 'number' && Number.isFinite(item.peak_voltage)) {
                            peakEl.innerText = `+${item.peak_voltage.toFixed(1)}`;
                        } else {
                            peakEl.innerText = '+230.0';
                        }
                    }
                    setValue(`kwh-${id}`, item.energy, 2);

                    const nomeEl = document.getElementById(`nome-device-${id}`);
                    if (nomeEl) nomeEl.innerText = item.device_name || 'Equipamento';

                    const statusEl = document.getElementById(`status-device-${id}`);
                    if (statusEl) {
                        if (hasData && isReleOff) {
                            statusEl.innerText = '● Dispositivo Desligado';
                            statusEl.style.color = '#f59e0b';
                        } else if (hasData) {
                            statusEl.innerText = '● Dispositivo Conectado';
                            statusEl.style.color = '#32CD32';
                        } else {
                            statusEl.innerText = '○ Sem dados do Dispositivo';
                            statusEl.style.color = 'var(--text-dim)';
                        }
                    }

                    const alertBox = document.getElementById(`alert-device-${id}`);
                    if (alertBox) {
                        const alertData = data.alertas ? data.alertas[id] : null;
                        if (alertData && !isReleOff) {
                            showNotification(id, alertData);
                        }
                    }

                    const releBtn = document.getElementById(`rele-btn-${id}`);
                    if (releBtn && !releBtn.classList.contains('loading')) {
                        if (isReleOff) {
                            releBtn.classList.remove('on');
                            releBtn.classList.add('off');
                        } else {
                            releBtn.classList.remove('off');
                            releBtn.classList.add('on');
                        }
                    }
                });

                // Garante que os fixos 1 e 2 apareçam zerados se não vierem na API
                ['1', '2'].forEach(id => {
                    if (!idsRecebidos.includes(id)) resetCardToZero(id);
                });
            }
        })
        .catch(err => {
            console.error('Erro na atualização:', err);
            // Se falhar a conexão, reseta os dispositivos fixos para zero em vez de mostrar erro
            ['1', '2'].forEach(id => resetCardToZero(id));
        });
}

setInterval(atualizarDashboard, 1000);

document.addEventListener('DOMContentLoaded', function () {
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

window.adicionarDispositivo = function() {
    const nome = prompt("Informe o nome do novo equipamento para simulação:");
    if (nome && nome.trim() !== "") {
        fetch(`${BACKEND_URL}/api/receber-dados/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-ESP32-KEY': '12345' // API Key padrão
            },
            body: JSON.stringify({
                device_id: Math.floor(Math.random() * 1000) + 100, // ID aleatório para mock
                device_name: nome.trim(),
                voltage: 0,
                current: 0,
                power: 0,
                is_mock: true
            })
        })
        .then(() => {
            alert("Dispositivo adicionado para simulação!");
            atualizarDashboard();
        })
        .catch(err => alert("Erro ao adicionar dispositivo: " + err));
    }
}

window.toggleRele = function(id) {
    const btn = document.getElementById(`rele-btn-${id}`);
    if (!btn) return;
    if (btn.classList.contains('loading')) return;
    const isCurrentlyOn = btn.classList.contains('on');
    btn.classList.add('loading');
    btn.style.pointerEvents = 'none';

    fetch(`${BACKEND_URL}/api/toggle-rele/${id}/`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'sucesso') {
            alert("Erro ao alternar relé");
        }
    })
    .catch(() => alert("Erro de conexão com o servidor"))
    .finally(() => {
        btn.classList.remove('loading');
        btn.style.pointerEvents = '';
    });
}

window.editarNome = function(id) {
    const novoNome = prompt("Digite o novo nome para este equipamento:");
    if (novoNome && novoNome.trim() !== "") {
        fetch(`${BACKEND_URL}/api/editar-dispositivo/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: id, nome: novoNome.trim() })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'sucesso') {
                alert("Erro ao renomear: " + (data.mensagem || "Erro desconhecido"));
            }
        });
    }
}
