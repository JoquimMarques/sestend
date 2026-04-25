let activeNotifications = {};

function showNotification(deviceId, alertData) {
    const alertBox = document.getElementById(`alert-device-${deviceId}`);
    if (!alertBox) return;

    const key = `${deviceId}-${alertData.tipo}`;
    
    if (activeNotifications[key]) {
        // Incrementa contador se o alerta já existe
        activeNotifications[key].count++;
        const badge = document.getElementById(`toast-count-${key}`);
        if (badge) {
            badge.innerText = `+${activeNotifications[key].count}`;
            badge.style.display = 'inline-block';
        }
        return;
    }

    // Cria nova notificação
    activeNotifications[key] = { count: 1 };
    const isCritico = alertData.cor === 'red';
    
    // Configura o alertBox para modo persistente
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

function atualizarDashboard() {
    fetch('/api/dados-recentes/')
        .then(response => response.json())
        .then(data => {
            if (data.status === "sucesso" && data.dados) {
                data.dados.forEach(item => {
                    const id = item.device_id;
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

                    if (document.getElementById(`v-${id}`)) {
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
                                peakEl.innerText = '+0.0';
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
                                // Dispara ou atualiza a notificação persistente dentro do card
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
                    }
                });
            }
        })
        .catch(err => console.error('Erro na atualização:', err));
}

// Atualiza a interface a cada 1 segundo para maior fluidez e resposta aos alertas.
setInterval(atualizarDashboard, 1000);

// Configura botoes de navegacao mobile e overlay para fechamento do menu lateral.
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.getElementById('mobile-toggle');
    if (!sidebar || !mobileToggle) {
        return;
    }

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    const abrirMenu = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    };

    const fecharMenu = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    mobileToggle.addEventListener('click', function () {
        const aberto = sidebar.classList.contains('active');
        if (aberto) {
            fecharMenu();
        } else {
            abrirMenu();
        }
    });

    overlay.addEventListener('click', fecharMenu);

    document.querySelectorAll('.sidebar .nav-item, .sidebar .logout-link').forEach(function (el) {
        el.addEventListener('click', fecharMenu);
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            fecharMenu();
        }
    });
});

window.toggleRele = function(id) {
    const btn = document.getElementById(`rele-btn-${id}`);
    if (!btn) return;
    if (btn.classList.contains('loading')) return;
    const isCurrentlyOn = btn.classList.contains('on');
    btn.classList.add('loading');
    btn.style.pointerEvents = 'none';
    if (isCurrentlyOn) btn.classList.replace('on', 'off'); else btn.classList.replace('off', 'on');

    fetch(`/api/toggle-rele/${id}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'sucesso') {
            if (isCurrentlyOn) btn.classList.replace('off', 'on'); else btn.classList.replace('on', 'off');
        }
    })
    .catch(() => {
        if (isCurrentlyOn) btn.classList.replace('off', 'on'); else btn.classList.replace('on', 'off');
    })
    .finally(() => {
        btn.classList.remove('loading');
        btn.style.pointerEvents = '';
    });
}

window.editarNome = function(id) {
    const novoNome = prompt("Digite o novo nome para este equipamento:");
    if (novoNome && novoNome.trim() !== "") {
        fetch('/api/editar-dispositivo/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                device_id: id,
                nome: novoNome.trim()
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                location.reload();
            } else {
                alert("Erro ao renomear: " + (data.mensagem || "Erro desconhecido"));
            }
        });
    }
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
