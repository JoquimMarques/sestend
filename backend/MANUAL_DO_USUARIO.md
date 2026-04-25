# 📘 Guia Simples do Sistema SistEnd

Este guia foi criado para ajudar você a entender como o sistema funciona, mesmo que não saiba nada de programação!

## 🚀 O que é o SistEnd?
O SistEnd é um sistema de monitoramento de energia. Ele recebe informações de sensores (como o ESP32) e mostra para você em tempo real se o consumo está normal, se houve um pico de energia ou se algum aparelho está gastando demais.

---

## 🖥️ Como usar o Dashboard (Painel Principal)

O Dashboard é a sua tela principal. Nela você verá quadrados (cartões) para cada equipamento.

### 🔌 Informações detalhadas por equipamento:
- **Tensão (V):** É a "força" da energia (ex: 110V ou 220V).
- **Corrente (A):** É o quanto de energia está "fluindo" naquele momento.
- **Consumo (kWh):** É o total acumulado que aquele aparelho gastou.
- **Pico Máximo:** Mostra a maior voltagem que o aparelho já recebeu (importante para saber se houve surtos elétricos).

### 🛠️ Ações rápidas:
- **📝 Editar Nome:** Clique no ícone de lápis ao lado do nome para renomear o aparelho (ex: "Geladeira da Cozinha").
- **⚙️ Configurar:** O ícone de engrenagem permite definir limites de alerta (apenas para administradores).
- **🗑️ Apagar Equipamento:** O ícone da lixeira permite remover um equipamento virtual ou adicionado por engano (apenas para administradores).

---

## 📋 Outras Páginas do Sistema

No menu lateral, você encontrará:
1. **Dashboard:** A visão geral que explicamos acima.
2. **Registros de Alarmes:** Uma lista de quando aconteceram picos de energia ou sobreconsumo.
3. **Registros de SubConsumo:** Mostra quando os aparelhos estão gastando pouco ou estão desligados.
4. **Relatório Geral:** Uma tabela completa com todo o histórico de leituras.

---

## ❓ Perguntas Frequentes

### **"Não consigo apagar um equipamento, por quê?"**
Agora o sistema foi corrigido! Se você é um **Administrador (ADM)**, verá o ícone da lixeira nos equipamentos que você adicionou ou nos virtuais. Note que os dispositivos principais (dispositivos 1 e 2) são protegidos e não podem ser apagados para não quebrar o sistema.

### **"Como adiciono um novo equipamento?"**
No topo do Dashboard, clique no botão azul **"+ Adicionar Equipamento"**. Dê um nome a ele e pronto! Ele aparecerá no seu painel.

---

**Dica:** Sair do sistema sempre que terminar de usar para manter seus dados seguros! (Botão "Sair" no final do menu lateral).
