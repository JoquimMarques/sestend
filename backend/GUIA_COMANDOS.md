## 1. Iniciando o Servidor Django
**IMPORTANTE**: Você deve estar dentro da pasta `projeto_esp32`.

### No Windows (Execução Direta):
Se a ativação do `venv` falhar, use:
```cmd
cd projeto_esp32
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

### No macOS/Linux:
```bash
cd projeto_esp32
./venv/bin/python manage.py runserver 0.0.0.0:8000
```
*O uso de `0.0.0.0` permite que o ESP32 encontre o seu PC na rede local.*

## 2. Gerenciamento de Banco de Dados
Se você fizer mudanças nos modelos (campos novos), use estes comandos:
```bash
./venv/bin/python manage.py makemigrations
./venv/bin/python manage.py migrate
```

## 3. Criando um Usuário (Admin)
Para acessar o Dashboard e o painel administrativo, você precisa de um superusuário:
```bash
./venv/bin/python manage.py createsuperuser
```

## 4. Testando a API (Simulação de ESP32)
Para verificar se o servidor está recebendo dados corretamente sem precisar ligar o ESP32 físico:
```bash
./venv/bin/python /tmp/test_esp32.py
```

## 5. Endereços de Acesso
- **Dashboard Principal**: `http://localhost:8000/`
- **Relatórios**: `http://localhost:8000/relatorio/`
- **Painel Admin**: `http://localhost:8000/admin/`
- **Chave de API (X-ESP32-KEY)**: `12345` (configurada no `settings.py`)

## 6. Configuração do ESP32 (Arduino)
No arquivo `arduino/pzem_wifi_django.ino`, certifique-se de configurar:
- `ssid`: Nome do seu WiFi.
- `password`: Senha do seu WiFi.
- `serverUrl`: O endereço IP do seu computador (ex: `http://192.168.1.10:8000/api/receber-dados/`).

---
**Dica Profissional**: Para descobrir o IP do seu computador no Mac, use o comando `ipconfig getifaddr en0` ou olhe em Preferências do Sistema > Rede.
