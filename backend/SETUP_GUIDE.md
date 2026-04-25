# Guia de Instalação do Projeto (ESP32 + Django)

Este guia contém todas as instruções necessárias para configurar e rodar este projeto em um novo computador.

---

## 1. Pré-requisitos

Certifique-se de ter instalado no seu computador:
- **Python 3.8 ou superior**: [Download Python](https://www.python.org/downloads/)
- **Git** (Opcional, para clonar o repositório): [Download Git](https://git-scm.com/)
- **Arduino IDE**: Para carregar o código no ESP32. [Download Arduino IDE](https://www.arduino.cc/en/software)

---

## 2. Configurando o Ambiente Python (Backend)

1. **Abra o terminal** e navegue até a pasta do projeto:
   ```bash
   cd "projeto_esp32"
   ```

2. **Crie um ambiente virtual (venv)**:
   ```bash
   python -m venv venv
   ```

3. **Ative o ambiente virtual**:
   - **No Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - **No macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Instale as dependências**:
   ```bash
   pip install -r requirements.txt
   ```

---

## 3. Preparando o Banco de Dados

Com o ambiente virtual ativado, execute os seguintes comandos:

1. **Criar as tabelas**:
   ```bash
   python manage.py migrate
   ```

2. **Criar um usuário administrador** (para acessar o Dashboard):
   ```bash
   python manage.py createsuperuser
   ```
   *Siga as instruções no terminal para definir nome de usuário, e-mail e senha.*

---

## 4. Rodando o Servidor

Para que o ESP32 consiga enviar dados para o seu PC, você deve rodar o servidor no endereço `0.0.0.0`:

```bash
python manage.py runserver 0.0.0.0:8000
```

> [!IMPORTANT]
> **Descubra seu IP Local**: No Mac, use `ipconfig getifaddr en0`. No Windows, use `ipconfig`.
> O IP será algo como `192.168.1.XX`. Você precisará desse número para o ESP32.

---

## 5. Configurando o ESP32 (Arduino)

1. Abra o arquivo `arduino/pzem_wifi_django.ino` na Arduino IDE.
2. No código, localize e altere as seguintes variáveis:
   - `ssid`: O nome do seu WiFi.
   - `password`: A senha do seu WiFi.
   - `serverUrl`: Substitua o IP pelo IP do seu computador (ex: `http://192.168.1.10:8000/api/receber-dados/`).
3. Conecte o ESP32 ao computador e faça o **Upload**.

---

## 6. Acesso ao Sistema

- **Dashboard**: `http://localhost:8000/`
- **Painel Administrativo**: `http://localhost:8000/admin/` (Use o usuário criado no passo 3.2)
- **Relatório Completo**: `http://localhost:8000/relatorio/`

---

## Solução de Problemas Comuns

- **ESP32 não conecta**: Verifique se o PC e o ESP32 estão na **mesma rede WiFi**.
- **Erro de Migração**: Se encontrar erros de banco, tente apagar o arquivo `db.sqlite3` e rodar `python manage.py migrate` novamente.
- **Chave de API**: A chave configurada no `settings.py` é `12345`. Certifique-se de que o HEADER `X-ESP32-KEY` no código do Arduino está correto.
