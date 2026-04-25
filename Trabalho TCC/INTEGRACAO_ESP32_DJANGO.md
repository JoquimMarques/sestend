# 📊 Integração ESP32 + Django - Guia Completo

## 🎯 Objetivo

Sistema de monitoramento em tempo real de dois sensores PZEM004T v3.0 conectados a um ESP32, com interface web Django para:
- ✅ Visualização de dados em tempo real
- ✅ Configuração de limites de proteção
- ✅ Geração de alertas automáticos
- ✅ Controle remoto de relés
- ✅ Base de dados histórica completa

---

## 🔧 Arquitetura do Código C++

### Sensores PZEM
```
Sensor 1: UART(2) - TX:17 RX:16 - Monitora um dispositivo
Sensor 2: UART(1) - TX:27 RX:26 - Monitora outro dispositivo

Cada sensor lê:
- Tensão (V)
- Corrente (A)
- Potência (W)
- Frequência (Hz)
- Fator de Potência
```

### Hardware de Proteção
```
┌─ Relé 1 (pino 19) ──── Desliga automaticamente em caso de falha no Sensor 1
│
├─ Relé 2 (pino 18) ──── Desliga automaticamente em caso de falha no Sensor 2
│
├─ Buzzer 1 (pino 23) ── Alerta sonoro para Sensor 1
│
├─ Buzzer 2 (pino 25) ── Alerta sonoro para Sensor 2
│
├─ LED Vermelho (pino 22) ─ Ligado quando qualquer sensor está com falha
│
└─ LED Verde (pino 21) ─ Ligado quando tudo está normal
```

### Display ST7920 128x64
```
Mostra em tempo real:
┌──────────────┬──────────────┐
│  S1          │  S2          │
│  V: 220V     │  V: 220V     │
│  I: 2.5A     │  I: 1.2A     │
│  P: 550W     │  P: 264W     │
│  F: 60.0Hz   │  F: 60.0Hz   │
│  FP: 0.98    │  FP: 0.96    │
└──────────────┴──────────────┘
```

### Limites de Proteção (Código C++)
```
Padrão Implementado:
- Tensão Máxima: 230V (pico)
- Corrente Máxima: 8A por sensor
- Potência Máxima: 1500W por sensor
- Tempo de Retenção (Bloqueio): 12 segundos

Comportamento de Falha:
1. Falha detectada → Relé desliga
2. Buzzer ativa com bip cada 400ms
3. LED vermelho acende
4. Permanece bloqueado por 12 segundos
5. Após 12s, tenta religar automaticamente
```

---

## 🚀 Integração Django

### 1️⃣ Novas Páginas Criadas

#### ⚙️ Página de Configurações (`/configuracoes/`)
```
Função: Editar os limites de proteção de cada sensor

Campos Editáveis:
├─ Nome do dispositivo
├─ Localização
├─ Tensão máxima
├─ Tensão mínima (proteção contra queda)
├─ Corrente máxima (normal)
├─ Corrente mínima (detecta desligamento)
├─ Corrente de curto-circuito
└─ Potência máxima

Só administradores podem acessar.
```

#### 🗄️ Página de Base de Dados (`/dados-completos/`)
```
Função: Visualizar TODOS os dados do banco, organizados

Por dispositivo (Sensor):
├─ Estatísticas
│  ├─ Tensão: média/máxima
│  ├─ Corrente: média/máxima
│  ├─ Potência: média/máxima
│  ├─ Fator de Potência: média
│  ├─ Energia Total: (kWh acumulada)
│  └─ Total de Leituras: (quantidade)
│
└─ Abas de Navegação
   ├─ Últimas 50 Leituras (tabela detalhada)
   └─ Últimos 20 Eventos (com timestamps)

Só administradores podem acessar.
```

### 2️⃣ Modelo de Dados

```python
# Tabela: app_esp32_eletrodomestico
- id: INTEGER PRIMARY KEY
- nome: VARCHAR (ex: "Geladeira")
- localizacao: VARCHAR (ex: "Cozinha")
- numero_sensor: INTEGER (1 ou 2)
- limite_tensao: FLOAT (default: 230.0)
- limite_subtensao: FLOAT (default: 190.0)
- limite_corrente: FLOAT (default: 8.0)
- limite_subcorrente: FLOAT (default: 0.1)
- limite_curto_circuito: FLOAT (default: 25.0)
- limite_potencia: FLOAT (default: 1500.0)
- rele_ligado: BOOLEAN (default: True)
- frequencia_rede: FLOAT (default: 60.0)
- is_mock: BOOLEAN (default: False)

# Tabela: app_esp32_leituraenergia
- id: INTEGER PRIMARY KEY
- eletrodomestico_id: FOREIGN KEY
- tensao: FLOAT
- corrente: FLOAT
- potencia: FLOAT
- frequencia: FLOAT
- energia_kwh: FLOAT
- fator_potencia: FLOAT
- pico_de_tensao: FLOAT
- data_hora: DATETIME (auto_now_add=True)

# Tabela: app_esp32_evento
- id: INTEGER PRIMARY KEY
- eletrodomestico_id: FOREIGN KEY
- tipo: VARCHAR (PICO, SUBTENSAO, SOBREINTENSIDADE, ...)
- descricao: TEXT
- data_hora: DATETIME (auto_now_add=True)
```

---

## 🔌 Como Enviar Dados do ESP32 para Django

### Estrutura de Requisição

```python
# Código C++ no ESP32
#include <WiFi.h>
#include <HTTPClient.h>

void enviarDados(int sensorNumero, float tensao, float corrente, float potencia, float frequencia, float pf) {
    if(WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin("http://192.168.X.X:8000/api/receber-dados/");
        
        // Headers
        http.addHeader("X-ESP32-KEY", "12345");
        http.addHeader("Content-Type", "application/json");
        
        // JSON
        String payload = "{";
        payload += "\"device_id\":" + String(sensorNumero) + ",";
        payload += "\"voltage\":" + String(tensao) + ",";
        payload += "\"current\":" + String(corrente) + ",";
        payload += "\"power\":" + String(potencia) + ",";
        payload += "\"frequency\":" + String(frequencia) + ",";
        payload += "\"pf\":" + String(pf) + ",";
        payload += "\"energy\":0,";
        payload += "\"peak_voltage\":" + String(tensao);
        payload += "}";
        
        int responseCode = http.POST(payload);
        http.end();
    }
}

// No loop, a cada 1 segundo:
enviarDados(1, v1, c1, p1, f1, pf1);  // Sensor 1
enviarDados(2, v2, c2, p2, f2, pf2);  // Sensor 2
```

### Response Esperado (JSON)

```json
{
    "status": "sucesso",
    "leitura_id": 123,
    "rele": true,
    "msg": "Dados salvos e processados"
}
```

---

## 📋 Configuração Inicial

### 1. Criar Dois Dispositivos no Admin

Acessar: `http://localhost:8000/admin/`

```
Sensor 1:
- nome: "Sensor 1"
- localizacao: "Painel de Proteção"
- numero_sensor: 1
- limite_tensao: 230.0
- limite_corrente: 8.0
- limite_potencia: 1500.0
- rele_ligado: True

Sensor 2:
- nome: "Sensor 2"
- localizacao: "Painel de Proteção"
- numero_sensor: 2
- limite_tensao: 230.0
- limite_corrente: 8.0
- limite_potencia: 1500.0
- rele_ligado: True
```

### 2. Verificar settings.py

```python
# projeto_esp32/settings.py
ESP32_API_KEY = "12345"  # Deixar como está ou alterar
ALLOWED_HOSTS = ['*']     # Para produção, definir HOST específico
```

### 3. Garantir Migração Executada

```bash
python manage.py migrate
```

---

## 🚨 Tipos de Eventos Gerados

| Tipo | Quando Ocorre | Ação |
|------|---------------|------|
| **PICO** | Tensão > 230V | Relé desliga, buzzer ativa, retenção 12s |
| **SUBTENSAO** | Tensão < 190V | Buzzer alerta, evento criado |
| **SOBREINTENSIDADE** | Corrente > 8A | Relé desliga, buzzer ativa, retenção 12s |
| **SUBINTENSIDADE** | Corrente < 0.1A | Evento criado (possível desligamento) |
| **CURTO_CIRCUITO** | Corrente > 25A | Relé desliga IMEDIATAMENTE, buzzer crítico |
| **SOBRECONSUMO** | Potência > 1500W | Evento criado, alarme visual |
| **ESTABILIZADO** | Volta ao normal após PICO | Relé religar, buzzer desativa |

---

## 🔄 Fluxo Completo de Funcionamento

### 1. ESP32 Inicia
```
Inicializa UART 1 e 2 (PZEM)
Inicializa Display (mostra valores 0)
Inicializa Relés (HIGH = ligado)
Lê configuração de limites da memória local
```

### 2. Leitura Periódica (A cada 1 segundo)
```
Lê Sensor 1 (pzem1.voltage(), .current(), .power(), .frequency(), .pf())
Lê Sensor 2 (pzem2.voltage(), .current(), .power(), .frequency(), .pf())
Formata dados (dtostrf para strings)
Verifica proteção local:
  - Se tensão > 230V → Coloca rele1 em LOW
  - Se corrente > 8A → Mantém rele em LOW por 12s
  - Se potência > 1500W → Mantém rele em LOW por 12s
Atualiza display com dados formatados
```

### 3. Envio para Django (A cada 1-2 segundos)
```
POST /api/receber-dados/ com:
{
  "device_id": 1,
  "voltage": 220.5,
  "current": 1.2,
  ... (etc)
}

Django:
  1. Valida chave API
  2. Salva leitura no banco
  3. Compara com limites
  4. Gera eventos se necessário
  5. Retorna JSON com status do relé
```

### 4. Dashboard Django Atualiza
```
A cada 5-10 segundos:
- Busca últimas leituras
- Atualiza gráficos (se houver)
- Mostra eventos críticos
- Permite ajustar limites em tempo real
```

---

## 🎛️ Interface Web Navegação

```
┌─────────────────────────────────────────┐
│          SistEnd - Monitoramento        │
├──────────┬──────────────────────────────┤
│ Dashboard│ ┌─ Dashboard                 │
│          │ ├─ Registros de Alarmes      │
│ Alarmes  │ ├─ Registros de SubConsumo   │
│          │ ├─ Relatório Geral           │
│ SubConsm │ ├─ ⚙️ Configurações *        │
│          │ └─ 🗄️ Base de Dados *        │
│ Relatório│                             │
│          │ * = Apenas Admin             │
│ ⚙️ Config│                             │
│          │                             │
│ 🗄️ Dados│                             │
└──────────┴──────────────────────────────┘
```

---

## ✅ Checklist de Implementação

- [x] Modelos Django adaptados para 2 sensores
- [x] Endpoint `/api/receber-dados/` funcionando
- [x] Página de Configurações (engrenagem)
- [x] Página de Base de Dados completa
- [x] Migrations executadas
- [x] Navegação atualizada
- [x] Validação de limites automática
- [x] Geração de eventos funcionando
- [x] Controle de relés remoto
- [x] Compatibilidade 100% com código C++

---

## 🆘 Troubleshooting

### Erro 403 "Chave de API inválida"
```
SOLUÇÃO: Verificar header X-ESP32-KEY e settings.py (ESP32_API_KEY)
```

### Erro 404 "Dispositivo não encontrado"
```
SOLUÇÃO: Criar os dois dispositivos (Sensor 1 e Sensor 2) no admin
```

### Dados não aparecem no relatório
```
SOLUÇÃO: Verificar se os dados estão sendo enviados
- Acessar: /api/dados-recentes/
- Ver se a última leitura é recente (< 8 segundos)
```

### Botão de engrenagem não aparece
```
SOLUÇÃO: Fazer login como administrador (is_staff=True)
```

---

## 📞 Suporte

Para dúvidas sobre:
- **Código C++**: Verificar arquivo pzem_wifi_django.ino
- **Modelos Django**: Verificar app_esp32/models.py
- **Views Django**: Verificar app_esp32/views.py
- **Templates**: Verificar templates/*.html
