# Manual Explicativo do Sistema Visual (Frontend) - SistEnd

Este documento foi criado para explicar como funciona a parte visual do sistema SistEnd (o "Frontend") de uma forma muito simples, sem a necessidade de jargões técnicos complexos. Se você não é programador, este guia vai te ajudar a entender exatamente o que cada peça do quebra-cabeça faz.

---

## 1. O que é o Frontend?
Imagine que o sistema SistEnd é um restaurante. 
- O **Backend** (onde ficam os dados e os cálculos) é a **cozinha**.
- O **Frontend** é o **salão principal**, onde os clientes sentam, veem o cardápio, fazem os pedidos e recebem os pratos. 

Ou seja, o Frontend é tudo aquilo que o usuário **vê e interage** na tela do computador ou do celular. Os botões, as cores, os gráficos e as tabelas fazem parte dele.

---

## 2. As Três Ferramentas Básicas
Todo o visual do nosso sistema foi construído usando três tecnologias irmãs:
1. **HTML (O Esqueleto)**: É ele que diz "aqui vai ter um título", "aqui vai ter uma tabela" e "aqui vai ter um botão". Ele monta a estrutura da página.
2. **CSS (A Roupa e a Maquiagem)**: É o arquivo (`style.css`) responsável por deixar tudo bonito. Ele arredonda os botões, pinta o fundo de roxo escuro, cria o efeito de "vidro" fosco e garante que o site fique bom na tela pequena do celular.
3. **JavaScript / JS (O Cérebro e os Músculos)**: É a linguagem que dá **vida** ao site. Sem o JS, os botões não fariam nada quando clicados. É o JS que vai lá na "cozinha" (backend) buscar a informação de energia e atualiza a tela na mesma hora, sem precisar recarregar a página.

---

## 3. Entendendo os Arquivos "Cérebros" (JavaScript)
Nosso sistema tem pequenos arquivos "cérebros" separados, cada um cuidando de uma tarefa específica para não virar bagunça. Aqui está o que cada um faz:

### 🛡️ `auth.js` (O Segurança da Porta)
Ele é a primeira coisa que roda quando alguém abre o site.
- **O que faz?** Ele verifica se a pessoa tem o "crachá" (se fez login). Se tentar entrar na página de Alarmes sem login, o `auth.js` expulsa a pessoa de volta para a tela inicial.
- **Modo Administrador vs Usuário**: Ele também age como inspetor. Se você logou como "Usuário Comum", o `auth.js` pega uma borracha invisível e **apaga** todos os botões de "Deletar", "Editar" ou "Configurações" da sua tela. Assim, um usuário comum nunca conseguirá quebrar o sistema.

### ⚙️ `config.js` (O Livro de Endereços)
- **O que faz?** É um arquivo minúsculo que guarda o "endereço da cozinha" (o link do Backend). Todos os outros arquivos olham para o `config.js` para saber onde devem buscar as informações. Se o sistema mudar de servidor amanhã, basta trocar o link aqui e o site todo continua funcionando.

### 📊 `app.js` (O Gerente do Dashboard)
É o arquivo mais trabalhador da tela principal.
- **O que faz?** A cada 1 segundo, ele bate na porta do servidor e pergunta: *"Como está a energia agora?"*. 
- Ele pega essa resposta e atualiza os números na tela (Tensão, Corrente, Potência). 
- Ele também é o "vigia": se a energia passar do limite seguro que configuramos, o `app.js` pinta o card de vermelho na hora e solta um aviso na tela.

### 🔔 `alertas.js` e 📈 `consumo.js` (Os Arquivistas)
- **O que fazem?** Quando você entra na aba de Alarmes ou Consumo, esses arquivos vão até o banco de dados e pedem o histórico completo. Eles pegam essa lista gigante, organizam bonitinho em linhas e constroem a tabela que você vê na tela. Eles também fazem os filtros de data funcionarem.

### 📱 `sw.js` (O Instalador do Aplicativo / PWA)
- **O que faz?** Transforma nosso site comum em um verdadeiro Aplicativo de Celular (Progressive Web App). 
- Ele tira uma "foto" de como o sistema é por fora e guarda na memória do celular. Assim, mesmo se você estiver sem internet, o aplicativo abre na mesma hora e mostra as telas (embora os dados não atualizem sem internet).

---

## 4. Como o Sistema Conversa com a Placa ESP32?
A mágica de ver a energia atualizando na tela funciona assim:
1. O medidor físico capta a energia real da tomada.
2. A placa ESP32 (cérebro físico) envia esse número para o nosso Banco de Dados na internet (Backend).
3. O nosso Frontend (através do `app.js`) pergunta ao banco de dados: "Tem novidade?".
4. O banco devolve um pacote de dados chamado **JSON** (que é como um papelzinho escrito: `{"tensao": 220, "corrente": 5}`).
5. O `app.js` lê esse papelzinho, vai até o número na tela e troca o número antigo pelo número novo. Tudo isso acontece em 1 segundo.

---

## 5. Responsividade (Adaptando ao Celular)
Por que o site muda de formato quando abrimos no celular?
Isso é trabalho do **CSS**. Nele, existe uma regra chamada `@media (max-width: 768px)`.
Essa regra é uma ordem direta para o computador: *"Se a tela for menor que 768 pixels de largura (tela de celular), esconda o menu lateral, encolha os títulos e coloque as caixas de informação uma embaixo da outra em vez de lado a lado"*.

E o botãozinho de "hambúrguer" (as 3 listras) no celular? É o nosso JS trabalhando. Quando você clica nele, o JS manda o menu deslizar de fora da tela para dentro.

---

## Resumo da Ópera
O Frontend do SistEnd não guarda dados, não faz cálculos complexos de energia e nem controla a placa física. A função dele é **apenas se comunicar** com o servidor e **desenhar** as informações de uma forma bonita, segura, adaptável ao celular e extremamente fácil para os olhos do ser humano!
