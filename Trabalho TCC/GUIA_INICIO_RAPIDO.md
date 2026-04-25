# 🚀 Guia de Início Rápido - ESP32 + Django

## 1️⃣ Verificar que Tudo Está Instalado

```bash
cd "c:\Users\Marques\OneDrive\Desktop\Trabalho TCC"
python validar_integracao.py
```

Você deve ver: **🎉 EXCELENTE! Integração validada com sucesso!**

---

## 2️⃣ Iniciar o Django

```bash
# Terminal 1: Executar servidor Django
cd "c:\Users\Marques\OneDrive\Desktop\Trabalho TCC"
python projeto_esp32/manage.py runserver

# Esperado:
# Starting development server at http://127.0.0.1:8000/
```

---

## 3️⃣ Criar Dispositivos (Admin)

Abrir: `http://localhost:8000/admin/`

Login com suas credenciais.

### Criar Sensor 1:
```
Nome: Sensor 1
Localização: Painel Principal
Data Instalação: (data de hoje)
Número Sensor: 1
Limite Tensão: 230.0
Limite Corrente: 8.0
Limite Potência: 1500.0
Relé Ligado: ✅
Mock: ❌
```

### Criar Sensor 2:
```
Nome: Sensor 2
Localização: Painel Principal
Data Instalação: (data de hoje)
Número Sensor: 2
Limite Tensão: 230.0
Limite Corrente: 8.0
Limite Potência: 1500.0
Relé Ligado: ✅
Mock: ❌
```

---

## 4️⃣ Testar Integração (Sem ESP32 Físico)

```bash
# Terminal 2: Script de teste
cd "c:\Users\Marques\OneDrive\Desktop\Trabalho TCC"
python teste_esp32.py

# Menu interativo:
# 1. Teste Simples
# 2. Teste de Cenários
# 3. Teste de Loop
# 4. Sair
```

### Opção 1: Teste Simples
- Envia uma leitura de cada sensor
- Mostra resposta do servidor
- Útil para verificar conectividade

### Opção 2: Teste de Cenários
- Simula pico de tensão
- Simula sobrecorrente
- Simula sobreconsumo
- Verifica geração de eventos

### Opção 3: Teste de Loop
- Envia dados continuamente
- Para com Ctrl+C
- Útil para testar acumulação de dados

---

## 5️⃣ Acessar as Novas Páginas

### 📋 Dashboard Principal
```
http://localhost:8000/
```

### ⚙️ Configurações de Proteção (Admin apenas)
```
http://localhost:8000/configuracoes/

Aqui você pode:
- Editar limites de proteção
- Mudar nome dos sensores
- Alterar localização
- Salvar novas configurações
```

### 🗄️ Base de Dados Completa (Admin apenas)
```
http://localhost:8000/dados-completos/

Aqui você pode:
- Ver estatísticas por sensor
- Visualizar últimas 50 leituras
- Ver últimos 20 eventos
- Navegar entre abas
- Exportar para análise (copiar/colar)
```

---

## 6️⃣ Enviar Dados do ESP32 Real (Quando Tiver)

### No código C++, adicione (após conectar WiFi):

```cpp
#include <HTTPClient.h>
#include <WiFi.h>

// Seus dados WiFi
const char* ssid = "SSID_AQUI";
const char* password = "SENHA_AQUI";
const char* server_url = "http://192.168.X.X:8000/api/receber-dados/";
const char* api_key = "12345";

void enviarDados() {
    if(WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(server_url);
        
        http.addHeader("X-ESP32-KEY", api_key);
        http.addHeader("Content-Type", "application/json");
        
        // Sensor 1
        String json1 = "{\"device_id\":1,\"voltage\":" + String(v1) + 
                      ",\"current\":" + String(c1) + ",\"power\":" + String(p1) +
                      ",\"frequency\":60.0,\"pf\":" + String(pf1) + "}";
        http.POST(json1);
        http.end();
        
        // Sensor 2
        String json2 = "{\"device_id\":2,\"voltage\":" + String(v2) + 
                      ",\"current\":" + String(c2) + ",\"power\":" + String(p2) +
                      ",\"frequency\":60.0,\"pf\":" + String(pf2) + "}";
        http.begin(server_url);
        http.addHeader("X-ESP32-KEY", api_key);
        http.POST(json2);
        http.end();
    }
}

// No loop():
void loop() {
    // ... seu código de leitura de sensores ...
    
    if(millis() - ultimoEnvio >= 1000) {  // A cada 1 segundo
        ultimoEnvio = millis();
        enviarDados();
    }
}
```

---

## 🔍 Verificar Dados Enviados

### API de Dados Recentes:
```
http://localhost:8000/api/dados-recentes/
```

Você verá JSON com:
- Tensão, Corrente, Potência
- Status dos relés
- Alertas ativos
- Conectividade (< 8 segundos = online)

### Exemplo de Resposta:
```json
{
  "status": "sucesso",
  "dados": [
    {
      "device_id": 1,
      "device_name": "Sensor 1",
      "voltage": 220.5,
      "current": 1.2,
      "power": 264.6,
      "frequency": 60.0,
      "pf": 0.95,
      "rele": true,
      "has_data": true
    },
    ...
  ],
  "alertas": {
    "1": null,  // sem alerta
    "2": null
  }
}
```

---

## 📊 Estrutura de Dados Enviados

### Do ESP32 para Django (POST):
```json
{
  "device_id": 1 ou 2,
  "voltage": 220.5,
  "current": 1.2,
  "power": 264.6,
  "frequency": 60.0,
  "pf": 0.95,
  "energy": 0,
  "peak_voltage": 230.0
}
```

### Response do Django:
```json
{
  "status": "sucesso",
  "leitura_id": 123,
  "rele": true,
  "msg": "Dados salvos e processados"
}
```

---

## 🎯 Fluxo Completo de Funcionamento

```
ESP32
  ├─ Inicializa UART 1 e 2 (PZEM)
  ├─ Inicializa Display (ST7920)
  └─ Inicializa WiFi
     │
     └─> A cada 1 segundo:
          ├─ Lê Sensor 1 (UART 2)
          ├─ Lê Sensor 2 (UART 1)
          ├─ Atualiza Display
          ├─ Verifica proteção local
          │  ├─ Se V > 230V → Desliga Relé + Buzzer
          │  ├─ Se I > 8A → Desliga Relé + Buzzer (12s)
          │  └─ Se P > 1500W → Desliga Relé (12s)
          └─> Envia POST para Django
               │
               └─> Django
                    ├─ Valida API Key (X-ESP32-KEY)
                    ├─ Salva Leitura no BD
                    ├─ Gera Evento se necessário
                    ├─ Permite ver em Base de Dados
                    ├─ Permite editar limites em Configurações
                    └─> Return JSON (leitura_id, rele, status)
```

---

## 🚨 Troubleshooting Durante Teste

### Erro 403 "Chave de API inválida"
```
CAUSA: Header X-ESP32-KEY não corresponde a settings.py
SOLUÇÃO: Verificar se ESP32_API_KEY = "12345" em settings.py
```

### Erro 404 "Dispositivo não encontrado"
```
CAUSA: device_id não existe no banco
SOLUÇÃO: Criar Sensor 1 (id=1) e Sensor 2 (id=2) no admin
```

### Sem dados no Relatório
```
CAUSA: Dados antigos (> 8 segundos) ou não conectado
SOLUÇÃO: Executar teste novamente:
  python teste_esp32.py --loop
```

### Botão Engrenagem invisível
```
CAUSA: Usuário não é admin (is_staff=False)
SOLUÇÃO: Login com usuário que é_staff=True
```

---

## 📞 Arquivos de Referência

Para consultar depois:
- 📘 `INTEGRACAO_ESP32_DJANGO.md` - Guia completo e detalhado
- 📋 `RESUMO_IMPLEMENTACAO.md` - O que foi feito
- 🧪 `teste_esp32.py` - Script de teste
- ✅ `validar_integracao.py` - Validador
- 📖 `GUIA_COMANDOS.md` - Comandos Django (já existente)
- 📖 `MANUAL_DO_USUARIO.md` - Manual de uso (já existente)

---

## 🎉 Pronto!

Se chegou aqui com sucesso, sua integração ESP32 + Django está **100% funcional**!

### O que você tem agora:
✅ Página de Configurações (Engrenagem)
✅ Página de Base de Dados Completa (Ícone DB)
✅ API funcionando para o ESP32 enviar dados
✅ Geração automática de eventos (proteção ativa)
✅ Visualização de dados históricos
✅ Controle de relés
✅ Compatibilidade total com código C++

### Próximos passos opcionais:
- Testar com o ESP32 físico
- Adicionar gráficos com Chart.js
- Configurar alertas por email
- Exportar relatórios em PDF
- Implementar dashboard em tempo real (WebSocket)

**Divirta-se testando! 🚀**
