const BACKEND_URL = window.SISTEND_CONFIG ? window.SISTEND_CONFIG.BACKEND_URL : "http://localhost:8000";

async function carregarBaseDados() {
    try {
        const [resConf, resRel] = await Promise.all([
            fetch(`${BACKEND_URL}/api/configuracoes/`).then(r => r.json()),
            fetch(`${BACKEND_URL}/api/relatorio/`).then(r => r.json())
        ]);

        if (resConf.status === "sucesso" && resRel.status === "sucesso") {
            renderizarBaseDados(resConf.dados, resRel.dados);
        }
    } catch (err) {
        console.error("Erro ao carregar base de dados:", err);
    }
}

function renderizarBaseDados(dispositivos, todasLeituras) {
    const container = document.getElementById('database-container');
    container.innerHTML = '';
    
    dispositivos.forEach(d => {
        const leiturasDoDispositivo = todasLeituras.filter(l => l.equipamento === d.nome);
        
        const section = document.createElement('div');
        section.className = 'dispositivo-section';
        
        let tabelaHtml = '';
        if (leiturasDoDispositivo.length > 0) {
            tabelaHtml = `
                <table>
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Tensao (V)</th>
                            <th>Corrente (A)</th>
                            <th>Potencia (W)</th>
                            <th>Frequencia (Hz)</th>
                            <th>Fator Pot.</th>
                            <th>Energia (kWh)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leiturasDoDispositivo.map(l => `
                            <tr>
                                <td><strong>${new Date(l.data_hora).toLocaleString('pt-BR')}</strong></td>
                                <td><span class="value-normal">${l.tensao.toFixed(1)}</span></td>
                                <td><span class="value-normal">${l.corrente.toFixed(3)}</span></td>
                                <td><span class="value-normal">${l.potencia.toFixed(0)}</span></td>
                                <td>${l.frequencia.toFixed(1)}</td>
                                <td>${l.fator_potencia.toFixed(2)}</td>
                                <td><strong>${l.energia.toFixed(4)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            tabelaHtml = `
                <div class="empty-message">
                    <p>Nenhuma leitura disponível para este dispositivo</p>
                </div>
            `;
        }

        section.innerHTML = `
            <div class="section-header">
                <h2>
                    ${d.nome}
                    <span class="device-badge">Sensor #${d.numero_sensor}</span>
                </h2>
            </div>
            <div class="table-wrapper">
                ${tabelaHtml}
            </div>
        `;
        container.appendChild(section);
    });
    if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarBaseDados();
    
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
