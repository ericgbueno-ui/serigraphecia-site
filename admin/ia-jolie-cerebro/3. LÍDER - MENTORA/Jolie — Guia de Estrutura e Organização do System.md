# 🗂️ JOLIE NO OBSIDIAN — ESTRUTURA COMPLETA
## Guia de implementação do Cérebro da Jolie como vault inteligente
**Multi Trip Receptivos e Viagens**

---

> *Este documento define como transformar o Cérebro da Jolie em um vault do Obsidian com notas interconectadas, tags semânticas e visualização de mapa mental. O objetivo é que qualquer atualização em uma nota se propague como contexto por todo o sistema.*

---

## ARQUITETURA DO VAULT

```
📁 Jolie — Cérebro Multi Trip/
│
├── 📁 00 - Índice/
│   └── 🗺️ Mapa do Vault.md          ← nota raiz com links para tudo
│
├── 📁 01 - Empresa/
│   ├── Multi Trip — Identidade.md
│   ├── Posicionamento de Marca.md
│   └── Dados Institucionais.md
│
├── 📁 02 - Jolie/
│   ├── Jolie — Identidade Visual.md
│   ├── Jolie — Tom de Voz.md
│   └── Jolie — Modo Operacional.md   ← importar jolie-modo-operacional.md
│
├── 📁 03 - Clientes/
│   ├── Perfil — Cliente Luxo.md
│   ├── Perfil — Cliente Família.md
│   ├── Perfil — Cliente CLT.md
│   ├── Perfil — Casal Romântico.md
│   └── Perfil — Primeira Viagem.md
│
├── 📁 04 - Vendas/
│   ├── Sistema de Vendas.md
│   ├── Tabela de Preços.md
│   ├── Objeções e Respostas.md
│   └── Fluxo de Conversão.md
│
├── 📁 05 - Scripts/
│   ├── Script — Família.md
│   ├── Script — Casal.md
│   ├── Script — Executivo.md
│   ├── Script — CLT.md
│   └── Script — Primeira Viagem.md
│
├── 📁 06 - Persuasão/
│   ├── Headlines por Contexto.md
│   ├── Gatilhos Mentais.md
│   ├── Frases de Ancoragem.md
│   ├── Copies Sazonais.md
│   └── Scripts de Vídeo.md
│
├── 📁 07 - Turismo/
│   ├── Gramado — Visão Geral.md
│   ├── Canela — Visão Geral.md
│   ├── Atrações Gratuitas.md
│   ├── Atrações Pagas.md
│   ├── Gastronomia.md
│   ├── Hotéis por Perfil.md
│   └── Roteiros por Perfil.md
│
├── 📁 08 - Operacional/
│   ├── Rotas de Transfer.md
│   ├── Regras Operacionais.md
│   └── Prompt Mestre WhatsApp.md    ← importar jolie-prompt-mestre-whatsapp.md
│
├── 📁 09 - Marketing/
│   ├── Estratégias Meta Ads.md
│   ├── Estratégias Google Ads.md
│   └── Calendário Sazonal.md
│
└── 📁 10 - Aprendizado/
    ├── Feedbacks de Clientes.md
    ├── Conversas que Converteram.md
    └── O que Não Funciona.md
```

---

## SISTEMA DE TAGS

Use estas tags de forma consistente em todas as notas:

### Tags de Tipo
```
#perfil         → notas sobre tipos de cliente
#script         → conversas modelo e fluxos de atendimento
#objeção        → respostas para resistências do cliente
#roteiro        → itinerários turísticos
#hotel          → hospedagens recomendadas
#gastronomia    → restaurantes, cafés, experiências de comida
#preço          → tabelas, valores, formas de pagamento
#persuasão      → headlines, copies, gatilhos
#operacional    → regras, logística, processos internos
#marketing      → ads, conteúdo, estratégia digital
```

### Tags de Contexto
```
#gramado        → conteúdo específico de Gramado
#canela         → conteúdo específico de Canela
#whatsapp       → conteúdo para atendimento no WA
#instagram      → conteúdo para redes sociais
#ads            → para campanhas pagas
```

### Tags Sazonais
```
#natal-luz      → outubro a janeiro
#inverno        → junho a agosto
#pascoa         → março a abril
#dia-dos-namorados → junho
#alta-temporada → qualquer período de pico
#baixa-temporada → fora dos períodos acima
```

### Tags de Perfil
```
#luxo           → cliente de alto poder aquisitivo
#familia        → família com crianças
#clt            → trabalhador assalariado / sonho Gramado
#casal          → casal romântico / lua de mel / aniversário
#primeira-vez   → turista que nunca foi a Gramado
```

---

## NOTAS PRINCIPAIS — MODELO DE ESTRUTURA

### Exemplo: Perfil — Casal Romântico.md

```markdown
---
tags: [#perfil, #casal, #whatsapp, #gramado]
relacionado: [[Script — Casal]], [[Roteiros por Perfil]], [[Hotéis por Perfil]], [[Gastronomia]]
atualizado: 2026-05-07
---

# Perfil — Casal Romântico

## Quem é
...

## Sinais de identificação
...

## Frases reais que usa
...

## O que fecha a venda
...

## Variações sazonais
- **[[Inverno]]** → #inverno
- **[[Natal Luz]]** → #natal-luz
- **[[Dia dos Namorados]]** → #dia-dos-namorados

## Scripts relacionados
→ [[Script — Casal]]

## Roteiros que funcionam pra esse perfil
→ [[Roteiros por Perfil#Casal Romântico]]

## Hotéis que ele prefere
→ [[Hotéis por Perfil#Casal]]
```

---

### Exemplo: Script — CLT.md

```markdown
---
tags: [#script, #clt, #whatsapp, #objeção]
relacionado: [[Perfil — Cliente CLT]], [[Tabela de Preços]], [[Objeções e Respostas]]
atualizado: 2026-05-07
---

# Script — Cliente CLT

## Abertura
...

## Diagnóstico invisível
...

## Apresentação do valor
...

## Oferta com parcelamento
...

## Quando ele diz "tá caro"
→ ver [[Objeções e Respostas#Tá Caro]]

## Quando ele some
...

## Fechamento suave
...
```

---

## MAPA DO VAULT — NOTA RAIZ

Crie uma nota chamada `🗺️ Mapa do Vault.md` na pasta `00 - Índice` com o seguinte conteúdo:

```markdown
# 🧠 Mapa do Cérebro da Jolie

Este vault é o sistema nervoso central da Jolie — concierge oficial da Multi Trip.

## Por onde começar
- [[Jolie — Identidade Visual]] — quem ela é
- [[Jolie — Modo Operacional]] — como ela age
- [[Sistema de Vendas]] — como ela converte

## Por tipo de cliente
- [[Perfil — Cliente Luxo]]
- [[Perfil — Cliente Família]]
- [[Perfil — Cliente CLT]]
- [[Perfil — Casal Romântico]]
- [[Perfil — Primeira Viagem]]

## Por necessidade imediata
- Atender agora → [[Prompt Mestre WhatsApp]]
- Responder objeção → [[Objeções e Respostas]]
- Vender Natal Luz → [[Copies Sazonais#Natal Luz]]
- Criar conteúdo → [[Scripts de Vídeo]] | [[Headlines por Contexto]]
- Indicar hotel → [[Hotéis por Perfil]]
- Montar roteiro → [[Roteiros por Perfil]]

## Consultas rápidas
- Preços → [[Tabela de Preços]]
- CNPJ e contato → [[Dados Institucionais]]
- Regras operacionais → [[Regras Operacionais]]
```

---

## LINKS BIDIRECIONAIS — CONEXÕES OBRIGATÓRIAS

Para que o Obsidian mostre o Graph View completo e útil, estas conexões são essenciais:

| Nota | Deve linkar para |
|---|---|
| Cada Perfil de Cliente | → Script correspondente, Roteiro, Hotel, Copies Sazonais |
| Cada Script | → Perfil correspondente, Objeções, Tabela de Preços |
| Objeções e Respostas | → Perfis, Scripts, Gatilhos Mentais |
| Tabela de Preços | → Regras Operacionais, Scripts |
| Copies Sazonais | → Perfis afetados, Calendário Sazonal |
| Roteiros por Perfil | → Atrações, Gastronomia, Hotéis |
| Hotéis por Perfil | → Perfis, Roteiros, Gastronomia |
| Prompt Mestre WhatsApp | → Todos os perfis, Tabela de Preços, Objeções |

---

## PLUGINS RECOMENDADOS

Instale estes plugins via Obsidian Community Plugins:

| Plugin | Para que serve |
|---|---|
| **Dataview** | Criar tabelas dinâmicas de notas por tag ou propriedade |
| **Templater** | Templates automáticos para novos perfis, scripts, objeções |
| **Tag Wrangler** | Gerenciar e renomear tags em massa |
| **Calendar** | Visualizar notas sazonais no calendário (útil para Natal Luz, inverno) |
| **Graph Analysis** | Ver quais notas são mais conectadas (= mais importantes) |
| **Kanban** | Transformar feedbacks de clientes em quadro de aprendizado |
| **Excalidraw** | Desenhar o ecossistema da Jolie como fluxo visual |

---

## ROTINA DE ATUALIZAÇÃO

### Semanal
- Registrar em `Feedbacks de Clientes.md` os padrões que apareceram nas conversas
- Adicionar à `Conversas que Converteram.md` qualquer script que fechou venda incomum
- Atualizar `O que Não Funciona.md` com objeções novas ou abordagens que não converteram

### Mensal
- Revisar `Tabela de Preços.md` se houver alteração de valores
- Atualizar `Copies Sazonais.md` conforme a época do ano
- Revisar os scripts com menor taxa de conversão e reescrever

### Trimestral
- Revisão geral do Cérebro com Rita e Eric
- Adicionar novos depoimentos reais de clientes em `Dados Institucionais.md`
- Atualizar `Hotéis por Perfil.md` e `Gastronomia.md` com novas indicações

---

## QUERY DATAVIEW — EXEMPLOS ÚTEIS

Cole estas queries em notas do Obsidian para criar dashboards dinâmicos:

### Todos os scripts disponíveis
```dataview
TABLE tags, atualizado
FROM #script
SORT atualizado DESC
```

### Conteúdo para Natal Luz
```dataview
LIST
FROM #natal-luz
SORT file.name ASC
```

### Notas sobre o perfil CLT
```dataview
LIST
FROM #clt
SORT file.name ASC
```

---

## PRÓXIMOS PASSOS DE IMPLEMENTAÇÃO

1. **Criar o vault** no Obsidian com a estrutura de pastas acima
2. **Importar** `cerebro-jolie.md` e quebrar em notas menores (uma por seção)
3. **Importar** `jolie-modo-operacional.md` como `Jolie — Modo Operacional.md`
4. **Importar** `jolie-prompt-mestre-whatsapp.md` como `Prompt Mestre WhatsApp.md`
5. **Adicionar o frontmatter** (tags, relacionado, atualizado) em cada nota
6. **Criar os links bidirecionais** conforme a tabela de conexões obrigatórias
7. **Instalar os plugins** recomendados
8. **Criar a nota raiz** `🗺️ Mapa do Vault.md`
9. **Abrir o Graph View** e verificar se as conexões fazem sentido visualmente
10. **Definir rotina de atualização** com Rita e Eric

---

*Jolie Obsidian Estrutura v1.0*
*Multi Trip Receptivos e Viagens*
*Criado: Maio 2026*
