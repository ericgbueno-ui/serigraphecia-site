---
tags: [aprendizado, feedback, retroalimentação, youtube, RAG, melhoria]
relacionado: [[Sistema de Vendas]], [[Diretrizes de Frota e Handoff]], [[Roteirização Avançada]], [[O que Não Funciona]]
atualizado: 2026-05-23
---

# Sistema de Retroalimentação: O Loop de Aprendizado Jolie

Este documento descreve como a inteligência da Jolie se auto-alimenta e se calibra continuamente a partir de informações positivas e negativas fornecidas pelos clientes (no WhatsApp) e capturadas a partir de canais especializados no YouTube. O objetivo é manter o cérebro da Jolie atualizado com o mercado real, sem intervenção técnica manual constante.

---

## 1. O Loop de Retroalimentação de Clientes (WhatsApp CRM)

A Jolie monitora o fluxo pós-serviço e as interações diárias no WhatsApp para classificar feedbacks em duas categorias estratégicas, gerando ações automáticas de ajuste de conduta e conhecimento.

### 1.1 Feedbacks Positivos (+) — Amplificação de Sucesso
* **O que são:** Mensagens de clientes elogiando a pontualidade, simpatia do motorista, conforto do carro, ou o roteiro sugerido pela Jolie.
* **Ação da Jolie:**
  1. **Registrar o Caso:** Salvar o resumo em `10 - Aprendizado/Feedbacks de Clientes.md` com a tag `#positivo` e o veículo/motorista associado.
  2. **Fortalecer a Prova Social:** Enviar o depoimento em formato de texto sanitizado (removendo dados pessoais) para o banco de dados de marketing e utilizá-lo ativamente em conversas de venda com o mesmo perfil de cliente (ex: usar um depoimento de família para rebater o medo de outra mãe sobre cadeirinhas).
  3. **Replicar o Padrão:** Identificar qual atração/restaurante do roteiro gerou o maior encantamento e mantê-la como "Parada Ouro" em novos roteiros padrão.

### 1.2 Feedbacks Negativos (-) — Mitigação de Danos e Ajuste Logístico
* **O que são:** Reclamações sobre atrasos, sujeira no carro, filas excessivas em um parque sugerido, ou experiências ruins em restaurantes indicados.
* **Ação da Jolie:**
  1. **Registrar a Fricção:** Salvar o incidente em `10 - Aprendizado/O que Não Funciona.md` com a tag `#critica`.
  2. **Gatilho de Handoff Imediato:** Se o cliente fizer uma reclamação séria durante o trajeto ou no pós-venda imediato, a Jolie entra no modo de acolhimento e dispara o transbordo para Rita e Eric solucionarem a crise fisicamente.
  3. **Rebaixamento de Recomendação:** Se um restaurante parceiro ou atração recomendada receber mais de duas críticas negativas em um mês, a Jolie automaticamente rebaixa sua pontuação na base `07 - Turismo/Gastronomia.md` ou `Atrações Pagas.md` e deixa de sugerir o local em novos roteiros personalizados até que o problema seja resolvido.

---

## 2. O Pipeline de Aprendizado via YouTube

O YouTube é a maior fonte de inteligência visual e comportamental sobre o turismo na Serra Gaúcha. A Jolie consome dados textuais estruturados do YouTube para manter sua base atualizada com as últimas novidades de Gramado e Canela.

### 2.1 Ingestão de Transcrições (CC) de Vídeos de Viagem
* **Objetivo:** Capturar novidades locais, reajustes de preços de ingressos, abertura de novas atrações e fechamento de pontos turísticos.
* **Mecanismo:**
  - Semanalmente, o worker de back-office busca vídeos novos dos canais mapeados (`@GramadoBlog`, `@RoteiroGramado`, etc.).
  - A transcrição textual do vídeo é extraída e submetida a um analisador de LLM que identifica **entidades, valores monetários e avaliações de pontos turísticos**.
  - As novidades encontradas são salvas em `07 - Turismo/` com a tag `#atualizado-youtube` e a data de referência, mantendo os preços e dicas de atrações da Jolie sempre à prova de erros.

### 2.2 Mineração de Comentários de Vídeos Quentes
* **Objetivo:** Mapear as frustrações, dúvidas e desejos mais recentes de quem está viajando agora para a Serra Gaúcha.
* **Mecanismo:**
  - O sistema varre os 50 comentários mais curtidos em vídeos virais de dicas de Gramado.
  - O LLM classifica os comentários em **Dores Logísticas** (*"O trânsito no centro estava terrível em julho"*) ou **Dúvidas Frequentes** (*"Dá para ir do aeroporto ao hotel de táxi fácil?"*).
  - Essas informações são consolidadas em `10 - Aprendizado/Conversas que Converteram.md` para calibrar o vocabulário persuasivo da Jolie no WhatsApp, ensinando-a a antecipar essas dores antes do cliente (ex: *"Muitas pessoas comentam que perdem até 2h de viagem na fila do táxi no desembarque de Porto Alegre. O nosso transfer garante que você saia em 2 minutos direto para o carro"*).

---

## 3. O Loop Tecnológico de Sincronização (RAG)

Para que toda essa retroalimentação física de arquivos Markdown vire inteligência conversacional ativa no WhatsApp, o ecossistema Multi Trip roda o seguinte fluxo de atualização:

```
[Markdown Criado/Modificado no Obsidian]
                 │
                 ▼
[Worker de Sync local lê a pasta cérebro-jolie/]
                 │
                 ▼
[Gera embeddings vetoriais com a OpenAI API]
                 │
                 ▼
[Upsert no Neon PostgreSQL - Tabela JolieKnowledge]
                 │
                 ▼
[A Jolie lê o banco atualizado a cada nova msg no WhatsApp]
```

Desta forma, uma crítica que você ou o cliente registraram no Obsidian em Porto Alegre se transforma em um ajuste de roteiro automático feito pela Jolie no WhatsApp minutos depois!

---
→ Ver [[Sistema de Vendas]]
→ Ver [[Diretrizes de Frota e Handoff]]
→ Ver [[O que Não Funciona]]
