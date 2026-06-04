# BLOCO 6 — ARQUITETURA JOLIE (CONCIERGE INTELIGENTE)
**multitrip-site — Modo Supremo Jolie**
**Data:** 2026-05-21 | **Branch:** `auditoria-bloco6-jolie` | **Build:** ✅ 48 rotas

---

## DIAGRAMA DA ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CANAIS DE ENTRADA                               │
│   WhatsApp                          Site Widget                      │
│   (número Jolie: 5551989129376)     (/api/jolie/chat)               │
└─────────────────┬───────────────────────────┬───────────────────────┘
                  │                           │
                  ▼                           ▼
   ┌──────────────────────┐    ┌──────────────────────────────────────┐
   │ /api/whatsapp        │    │ getJolieResponse()                   │
   │ Meta Cloud API v21   │    │ lib/jolie/get-response.ts            │
   │ HMAC-SHA256 verified │    │                                      │
   └──────────┬───────────┘    │  1. loadHistory(sessionId)           │
              │                │  2. searchKnowledge(msg, top-4 RAG)  │
              │                │  3. formatPricingContext(route)       │
              ▼                │  4. askClaude() → askGemini() → fb   │
   ┌──────────────────────┐    │  5. sanitizeReply() / detectIntent() │
   │ callJolie() em       │    │  6. persistConversation()            │
   │ whatsapp/route.ts    │    └──────────────────┬───────────────────┘
   │ (Gemini → GPT → fb)  │                       │
   └──────────┬───────────┘                       ▼
              │                    ┌──────────────────────────────────┐
              │                    │ JolieConversation (Neon)         │
              │                    │ sessionId, history JSON,         │
              │                    │ intent, handoffToHuman           │
              ▼                    └──────────────────────────────────┘
   ┌─────────────────────────────────────────────────────────────────┐
   │                    NEON PostgreSQL                               │
   │  Lead → Interaction (WhatsApp CRM)                              │
   │  JolieConversation (site widget sessions)    ← NOVO             │
   │  JolieBrain, JolieKnowledge (RAG), JolieClientMemory            │
   └─────────────────────────────────────────────────────────────────┘
```

---

## ARQUIVOS CRIADOS

### 1. `prisma/schema.prisma` — JolieConversation (model novo)
```prisma
model JolieConversation {
  sessionId      String   @unique   // site_timestamp_random ou phone
  phone          String?            // preenchido pelo WhatsApp
  channel        String @default("site")
  history        Json   @default("[]")  // [{role, content, timestamp}]
  intent         String?            // reserva | roteiro | objecao | etc.
  handoffToHuman Boolean @default(false)
  lastActivity   DateTime @default(now())
  ...
  @@index([phone])
  @@index([channel])
  @@index([lastActivity])
}
```
**Migration:** `prisma/migrations/20260521000000_add_jolie_conversation/migration.sql`

---

### 2. `src/lib/jolie/system-prompt.ts`
- `JOLIE_SYSTEM_PROMPT` — system prompt oficial canonizado como módulo TypeScript
- `HANDOFF_TRIGGERS` — termos que disparam escalação para humano
- `FORBIDDEN_TERMS` — termos proibidos no output da Jolie

---

### 3. `src/lib/jolie/knowledge-base.ts`
- `PRICING_TABLE` — preços por veículo e rota (`poa_gramado` | `caxias_gramado`)
- `getPrice(vehicle, route, tripType)` — helper que calcula preço com fator ida/volta
- `OPERATIONAL_RULES` — tolerância de espera (60min), prazo de alteração (24h), etc.
- `FAQ` — 10 entradas: cancelamento, atraso de voo, bagagem, criança, pet, acessibilidade, PIX, cartão
- `ITINERARIES` — 4 roteiros: casal, família, primeira vez, gastronomia
- `detectForbiddenTerms(text)` — detecta violações de vocabulário
- `formatPricingContext(route)` — formata tabela de preços para injeção no prompt

---

### 4. `src/lib/jolie/get-response.ts`
Função centralizada para o site widget:

```typescript
await getJolieResponse(message, sessionId, { phone?, route? })
// → { reply, intent, handoffToHuman, sessionId }
```

Fluxo interno:
1. Rate limit: 30 msgs/hora por sessionId (in-process, complementa middleware)
2. Carrega histórico das últimas 20 trocas de `JolieConversation`
3. RAG: `searchKnowledge(message, top-4)` — busca vetorial em `JolieKnowledge`
4. Monta system prompt enriquecido (JOLIE_SYSTEM_PROMPT + preços + RAG chunks)
5. Cascata de engines: Claude (sonnet-4-6) → Gemini (2.0 Flash) → fallback estático
6. Sanitiza output: detecta e substitui termos proibidos automaticamente
7. Detecta intenção: preco | reserva | roteiro | objecao | reclamacao | duvida
8. Detecta handoff: HANDOFF_TRIGGERS na mensagem ou na resposta
9. Persiste em `JolieConversation` de forma não-bloqueante (`.catch(() => {})`)

---

### 5. `src/app/api/jolie/chat/route.ts`
Endpoint `POST /api/jolie/chat`:

```typescript
// Request
{ message: string, route?: "poa_gramado" | "caxias_gramado" }

// Response
{ ok: true, reply: string, intent: string|null, handoffToHuman: boolean, sessionId: string }
```

- Sessão por cookie httpOnly `mt_jolie_sid` (7 dias, renovado a cada request)
- Separado do `/api/chat` legado (mantido sem alterações para compatibilidade)
- `maxDuration: 30` — adequado para função serverless Vercel

---

## COMO RODAR LOCALMENTE

```bash
# 1. Aplicar migration no banco de desenvolvimento
npx prisma migrate dev --name add_jolie_conversation

# 2. Testar o endpoint
curl -X POST http://localhost:3000/api/jolie/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quanto custa o transfer pra Gramado?"}'

# 3. Verificar sessão criada no banco
npx prisma studio
# → Tabela JolieConversation
```

## COMO SIMULAR MENSAGENS DE TESTE

```bash
# Teste 1: consulta de preço
curl -X POST http://localhost:3000/api/jolie/chat \
  -H "Content-Type: application/json" \
  -c /tmp/jolie_cookies.txt -b /tmp/jolie_cookies.txt \
  -d '{"message": "Preciso de um transfer do aeroporto pra Gramado para 2 pessoas"}'

# Teste 2: continuação de conversa (mesmo cookie = mesma sessão)
curl -X POST http://localhost:3000/api/jolie/chat \
  -H "Content-Type: application/json" \
  -c /tmp/jolie_cookies.txt -b /tmp/jolie_cookies.txt \
  -d '{"message": "Qual a diferença entre o Sedan e o Spin?"}'

# Teste 3: detectar forbidden terms
curl -X POST http://localhost:3000/api/jolie/chat \
  -d '{"message": "É tipo um Uber privado né?"}'
# → reply não deve conter "uber" nem "corrida"

# Teste 4: detectar handoff
curl -X POST http://localhost:3000/api/jolie/chat \
  -d '{"message": "Quero falar com uma pessoa real"}'
# → handoffToHuman: true
```

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

| Variável | Uso | Obrigatória |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude sonnet-4-6 (engine primária) | Sim para Claude |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini 2.0 Flash (fallback 1) | Recomendada |
| `DATABASE_URL` | Neon PostgreSQL — JolieConversation + RAG | Sim |
| `OPENAI_API_KEY` | Embeddings RAG (se usados) | Para RAG vetorial |
| `WHATSAPP_APP_SECRET` | Assinatura HMAC webhook Meta | Sim (WhatsApp) |
| `WHATSAPP_TOKEN` | Envio de mensagens WhatsApp | Sim (WhatsApp) |
| `JOLIE_WHATSAPP_NUMBER` | Número E.164 da Jolie: `5551989129376` | Referência |
| `TEAM_WHATSAPP_NUMBER` | Número E.164 da equipe: `5551986876557` | Referência |

---

## O QUE FALTA PARA PRODUÇÃO COMPLETA

| Item | Status | Ação necessária |
|---|---|---|
| Interface visual do chat no site | ❌ Não incluído (BLOCO 7) | Componente React + UI |
| Integração WhatsApp número Jolie | ❌ Manual | Configurar Meta Business + WABA para 5551989129376 |
| Migration aplicada no Neon | ⚠️ Pendente | `npx prisma migrate deploy` no próximo deploy |
| Claude na cadeia WhatsApp | ⚠️ Pendente | WhatsApp usa Gemini→GPT; adicionar Claude como primário (v1.1) |
| Rate limit Redis | ⚠️ Pendente | Rate limit atual é in-process (não persiste entre instâncias) |

---

## COMMITS

| Commit | Descrição |
|---|---|
| `f2acbc1` | feat(db): JolieConversation schema + migration SQL |
| `6921ab3` | feat(jolie): arquitetura completa — 4 arquivos, 648 linhas |

---

*Gerado em 2026-05-21 por Claude Sonnet 4.6 (Modo Supremo Jolie)*
*Branch: `auditoria-bloco6-jolie` | Build: ✅ 48 rotas | Sem push automático*
