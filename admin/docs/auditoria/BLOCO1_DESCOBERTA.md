# BLOCO 1 — DESCOBERTA E MAPEAMENTO
**Auditoria técnica multitrip-site — Modo Supremo Jolie**
**Data:** 2026-05-21 | **Auditor:** Claude Sonnet 4.6 (Modo Supremo) | **Modo:** READ-ONLY

---

## 1. INVENTÁRIO COMPLETO

### 1.1 Versões e Runtime

| Componente | Versão |
|---|---|
| Node.js | v24.15.0 |
| npm | 11.12.1 |
| Next.js | 16.2.2 |
| React | 18.3.1 |
| TypeScript | ^5 |
| Prisma | 5.22.0 |
| Tailwind CSS | v4 |
| Framer Motion | 11.11.0 |

### 1.2 Árvore de Diretórios (3 níveis — fonte de verdade)

```
multitrip-site/
├── cérebro-jolie/              ← Vault Obsidian (12 seções — knowledge base)
│   ├── 00 - Índice/
│   ├── 01 - Empresa/ … 12 - Histórias Reais/
├── docs/
│   └── auditoria/              ← Este documento
├── prisma/
│   ├── migrations/             ← 11 migrations (ver §2)
│   ├── schema.prisma
│   └── seed.ts / seed-jolie.ts
├── public/
│   ├── ads/                    ← Imagens, vídeo e script Python de ads
│   ├── brand/
│   └── photos/
├── scripts/                    ← Utilitários: backup, setup, seed, deploy
├── src/
│   ├── app/
│   │   ├── [affiliate]/        ← Landing page afiliado
│   │   ├── admin/              ← Painel admin (protegido por cookie)
│   │   ├── checkout/           ← Fluxo de pagamento
│   │   ├── components/         ← ~30 componentes de UI
│   │   ├── api/                ← 34 endpoints (ver §3)
│   │   ├── faq/ quem-somos/ privacidade/ termos-transfer/ transfer/
│   │   └── page.tsx / layout.tsx / globals.css
│   ├── components/ui/          ← Componentes reutilizáveis
│   └── lib/                    ← Toda a lógica de negócio
│       ├── jolie/              ← RAG, embeddings, brain, memory, learning
│       ├── services/           ← cashflow-service, pagamento-service
│       ├── server/             ← admAuth, adminAuth
│       └── *.ts                ← 40+ módulos (capi, mercadopago, notify, etc.)
├── middleware.ts               ← Auth + rate limit + CORS + security headers
├── vercel.json                 ← 7 cron jobs configurados
└── .env / .env.example
```

### 1.3 Dependências — Status

| Pacote | Versão atual | Nota |
|---|---|---|
| `next` | 16.2.2 | Recente (2026) |
| `react` | 18.3.1 | OK — React 19 disponível mas não urgente |
| `prisma` / `@prisma/client` | 5.22.0 | OK |
| `@google/generative-ai` | 0.24.1 | OK |
| `openai` | 6.34.0 | OK |
| `framer-motion` | 11.11.0 | OK |
| `zod` | 4.4.3 | OK |
| `nodemailer` | 8.0.1 | OK |
| `@vercel/analytics` | 2.0.1 | OK |
| `tailwindcss` | v4 | OK (breaking changes vs v3 — confirmar migração completa) |

---

## 2. BANCO NEON (PostgreSQL + pgvector)

### 2.1 Status das Migrations

```
Datasource: PostgreSQL "neondb" — ep-sparkling-salad-ad8l09gz-pooler.c-2.us-east-1.aws.neon.tech
11 migrations encontradas — Database schema is up to date ✅
```

### 2.2 Ordem das Migrations

| Migration | Data | Observação |
|---|---|---|
| 20260319000100_init_postgres | 2026-03-19 | Estrutura base |
| 20260428000000_add_affiliate_payment | 2026-04-28 | |
| 20260501_lead_crm | 2026-05-01 | **SEM TIMESTAMP COMPLETO** ⚠️ |
| 20260505000000_add_driver_fields | 2026-05-05 | |
| 20260506000000_add_customer_birthdate | 2026-05-06 | |
| 20260506000001_rename_customer_whatsapp_to_phone | 2026-05-06 | |
| 20260507000100_add_driver_in_out | 2026-05-07 | |
| 20260507000200_add_contract_pdf_url | 2026-05-07 | |
| 20260507000300_add_corrida_concluida | 2026-05-07 | |
| add_cashflow | **SEM TIMESTAMP** ⚠️ | Pode quebrar ordem em redeployment |
| 20260518140502_jolie_brain_rag | 2026-05-18 | pgvector + JolieBrain/Knowledge/Memory/Insight |

### 2.3 Models Declarados (16 total)

| Model | Propósito | Relações | Índices |
|---|---|---|---|
| `Lead` | CRM — cliente capturado via WhatsApp/site | → Interaction, LeadEvent, JolieClientMemory | status, score, createdAt |
| `Interaction` | Cada mensagem trocada (lead/jolie/human) | → Lead (cascade) | leadId, createdAt |
| `LeadEvent` | Eventos comportamentais + pontuação | → Lead (cascade) | leadId, type |
| `Customer` | Cliente com booking confirmado | → Booking | phone (unique) |
| `Affiliate` | Parceiros com código de comissão | → AffiliatePayment | active |
| `AffiliatePayment` | Pagamentos de comissão | → Affiliate | — |
| `Booking` | Reserva completa (IDA/VOLTA/CITY TOUR) | → Customer, Passenger, Payment | status |
| `Passenger` | Passageiro por booking (doc, tipo) | → Booking | — |
| `Payment` | Pagamento (MP, PIX, cartão) | → Booking, CashflowTransaction | providerId (unique) |
| `CashflowCategory` | Categorias de receita/despesa | → CashflowTransaction | type |
| `CashflowTransaction` | Fluxo de caixa por motorista | → CashflowCategory, Payment | motoristaId, categoryId, transactionDate |
| `MetaAdSpend` | Gasto diário Meta Ads (3× ao dia) | — | date, [date,accountId] |
| `JolieBrain` | Versões do prompt mestre (fonte de verdade) | — | active, version |
| `JolieKnowledge` | Base vetorial RAG (embedding 1536) | — | type, active, source |
| `JolieClientMemory` | Memória por cliente (embedding 1536) | → Lead (cascade) | profile |
| `JolieInsight` | Insights de conversões (learning loop) | — | converted, processed, type |

---

## 3. ROTAS E APIs

### 3.1 Páginas (App Router)

| Rota | Componente Principal | Proteção |
|---|---|---|
| `/` | `page.tsx` (homepage) | Pública |
| `/[affiliate]` | Landing page afiliado | Pública |
| `/checkout` | `CheckoutClient.tsx` | Pública |
| `/admin` | `AdminShell.tsx` + `ManualBookingForm.tsx` | Cookie `mt_admin_token` |
| `/faq` | Static | Pública |
| `/quem-somos` | Static | Pública |
| `/privacidade` | Static | Pública |
| `/termos-transfer` | Static | Pública |
| `/transfer` | Static | Pública |

### 3.2 Endpoints API (34 rotas)

#### ── CORE BUSINESS ──

| Endpoint | Método | Autenticação | Rate Limit | Observações |
|---|---|---|---|---|
| `POST /api/booking` | POST | Nenhuma ⚠️ | 120/min IP | Cria reserva |
| `GET /api/booking/status` | GET | Nenhuma | 120/min IP | Status da reserva |
| `GET /api/booking/public` | GET | Nenhuma | 120/min IP | Token público |
| `POST /api/mp/preference` | POST | Nenhuma ⚠️ | 120/min IP | Cria preferência MP |
| `POST /api/mp/webhook` | POST | Assinatura MP | 120/min IP | **Assinatura verificada ✅** |
| `GET /api/contracts/[id]` | GET | ? | 120/min IP | Contrato PDF |

#### ── JOLIE / IA ──

| Endpoint | Método | Autenticação | IA Chain | Observações |
|---|---|---|---|---|
| `POST /api/chat` | POST | **Nenhuma** ⚠️ | Claude → Gemini → GPT | Chat do site |
| `GET/POST /api/whatsapp` | GET+POST | HMAC-SHA256* | Gemini → GPT | *Bypassa se `WHATSAPP_APP_SECRET` vazio |
| `GET /api/debug-ai` | GET | **NENHUMA** 🚨 | — | **EXPÕE PREFIXO DAS CHAVES** |
| `POST /api/ai/analyze` | POST | ? | — | Análise de IA |
| `GET /api/ai/cron` | GET | ? | — | Cron IA |

#### ── CRM / LEADS ──

| Endpoint | Método | Autenticação | Observações |
|---|---|---|---|
| `GET /api/admin/leads` | GET | Cookie admin | Protegido ✅ |
| `POST /api/lead/event` | POST | Nenhuma | Tracking comportamental |
| `POST /api/abandonment` | POST | Nenhuma | Abandono de checkout |

#### ── ADMIN ──

| Endpoint | Método | Autenticação | Observações |
|---|---|---|---|
| `GET/POST /api/admin/marketing/audience-count` | GET | Cookie admin | |
| `POST /api/admin/marketing/send` | POST | Cookie admin | **Envio em massa — alto risco** |
| `POST /api/admin/whatsapp-test` | POST | Cookie admin | |

#### ── AFILIADOS ──

| Endpoint | Método | Autenticação | Observações |
|---|---|---|---|
| `POST /api/afiliado/login` | POST | Credenciais | JWT cookie |
| `POST /api/afiliado/logout` | POST | Cookie JWT | |
| `GET /api/afiliado/painel` | GET | Cookie JWT | |
| `GET /api/setup-afiliado` | GET | ? ⚠️ | Setup inicial — verificar proteção |

#### ── CRONS (Vercel) ──

| Endpoint | Schedule (UTC) | Proteção | Observações |
|---|---|---|---|
| `GET /api/cron/followup` | 13:00 diário | CRON_SECRET* | *Bypassa se var vazia |
| `GET /api/cron/birthday` | 12:00 diário | CRON_SECRET* | |
| `GET /api/cron/jolie?job=automations` | 12:00 diário | CRON_SECRET* | |
| `GET /api/cron/jolie?job=research` | 02:00 domingo | CRON_SECRET* | |
| `GET /api/cron/meta-ads` | 11, 15, 19:00 diário | CRON_SECRET* | 3× ao dia |

#### ── INTEGRAÇÕES EXTERNAS ──

| Endpoint | Método | Observações |
|---|---|---|
| `POST /api/meta-capi` | POST | **Sem autenticação** ⚠️ — CAPI público |
| `GET /api/zoho/callback` | GET | OAuth callback |
| `GET /api/google/reviews` | GET | Google Places API |

#### ── INFRA ──

| Endpoint | Descrição |
|---|---|
| `GET /api/health` | Health check (sem rate limit) |
| `GET /api/ping` | Ping simples (sem rate limit) |

---

## 4. INTEGRAÇÕES

### 4.1 WhatsApp
- **Tipo:** Meta Cloud API oficial (v21.0)
- **Verificação:** HMAC-SHA256 via `x-hub-signature-256` ✅
- **Vulnerabilidade:** Se `WHATSAPP_APP_SECRET` não estiver configurado, bypassa totalmente ⚠️
- **IA:** Gemini 2.0 Flash (primário) → GPT-4o-mini (fallback) → Fallback estático
- **Capacidades:** Texto, Áudio (Whisper), Imagem (Gemini Vision)
- **Número Jolie:** configurado via `WHATSAPP_PHONE_ID`
- **Alertas equipe:** `WHATSAPP_TEAM_NUMBER` (Eric/Rita)

### 4.2 IA — Arquitetura Híbrida

```
/api/chat (site widget):
  Claude 3.5 Sonnet → Gemini (cascata) → GPT-4o-mini → Fallback estático

/api/whatsapp (WhatsApp):
  Gemini 2.0 Flash (cascata) → GPT-4o-mini → Fallback estático
  [Claude NÃO está na cadeia do WhatsApp]

RAG (Jolie Intelligence):
  pgvector (1536 dims) — JolieKnowledge + JolieClientMemory
  Embeddings gerados via: src/lib/jolie/embeddings.ts
```

### 4.3 Pagamentos
- **Provedor:** Mercado Pago (Checkout Pro)
- **Webhook:** `POST /api/mp/webhook` — assinatura MP verificada ✅
- **Geração de link:** Automática pela Jolie via WhatsApp (veículos Sedan Premium e Spin) ou manualmente no admin
- **Escalação:** Sedan Executivo, SUV, SUV Elétrico → equipe humana (sem geração automática)

### 4.4 Calendário
- **Provedor:** Zoho Calendar
- **Trigger:** Confirmação de pagamento via webhook MP
- **Fluxo:** `criarEventoZoho()` → salva `zohoEventUid` no Booking
- **⚠️ Env vars Zoho não documentadas no `.env.example`**

### 4.5 Notificações
- **Email:** Resend (SMTP + API)
- **WhatsApp:** Meta API → número da equipe (alertas) e Jolie (confirmação ao cliente)

### 4.6 Analytics / Tracking
- Google Analytics 4: `G-5CETDMGZQ`
- Google Tag Manager: `GTM-WZMCLKHW`
- Meta Pixel: `1297864089124981`
- Meta CAPI (server-side): `POST /api/meta-capi`
- Vercel Analytics: `@vercel/analytics`

### 4.7 Env Vars Necessárias (30+ variáveis)

| Categoria | Vars | Status |
|---|---|---|
| Banco | `DATABASE_URL`, `POSTGRES_URL_NON_POOLING` | Configuradas |
| WhatsApp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_TEAM_NUMBER` | `APP_SECRET` pode estar ausente ⚠️ |
| IA | `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Verificar |
| Pagamentos | `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | Verificar |
| Crons | `CRON_SECRET` | Crítico se vazio ⚠️ |
| Admin | `ADMIN_PASSWORD` | Verificar |
| Meta Ads | `META_ADS_ACCESS_TOKEN`, `META_ADS_ACCOUNT_ID` | Configuradas |
| CAPI | `META_CAPI_ACCESS_TOKEN` | Verificar |
| Zoho | Não documentadas | ⚠️ |
| Email | `RESEND_API_KEY`, `SMTP_*` | Verificar |

---

## 5. DIAGRAMA DE FLUXO — CLIENTE → SISTEMA

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CANAIS DE ENTRADA                            │
│  WhatsApp  ──┐   Site (chat)  ──┐   Site (checkout) ──┐            │
└──────────────┼──────────────────┼─────────────────────┼────────────┘
               │                  │                      │
               ▼                  ▼                      ▼
   ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
   │ /api/whatsapp   │  │  /api/chat       │  │ /api/booking         │
   │ Meta Cloud API  │  │  ConciergeChat   │  │ /api/mp/preference   │
   │ HMAC verified   │  │  widget          │  │                      │
   └────────┬────────┘  └────────┬─────────┘  └──────────┬───────────┘
            │                    │                        │
            ▼                    ▼                        │
   ┌──────────────────────────────────────┐               │
   │         JOLIE IA ENGINE              │               │
   │  Gemini 2.0 Flash → GPT-4o-mini     │               │
   │  RAG: pgvector (JolieKnowledge)      │               │
   │  Memória: JolieClientMemory          │               │
   └──────────────────┬───────────────────┘               │
                      │                                    │
                      ▼                                    ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                    NEON (PostgreSQL)                             │
   │  Lead → Interaction → LeadEvent                                  │
   │  Customer → Booking → Passenger → Payment                        │
   │  CashflowTransaction → MetaAdSpend                               │
   └────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                   MERCADO PAGO                                   │
   │  Preference creation → checkout → POST /api/mp/webhook           │
   └────────────────────────┬─────────────────────────────────────────┘
                            │ pagamento CONFIRMED
                            ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │              PÓS-PAGAMENTO (simultâneo)                          │
   │  ① Zoho Calendar → criarEventoZoho() → salva zohoEventUid        │
   │  ② notifyTeam() → WhatsApp equipe (Eric/Rita)                    │
   │  ③ notifyCliente() → WhatsApp Jolie → confirmação ao cliente     │
   │  ④ markLeadConverted() → CRM atualizado                          │
   │  ⑤ META CAPI → evento Purchase server-side                      │
   └──────────────────────────────────────────────────────────────────┘
```

---

## 6. PONTOS CRÍTICOS DETECTADOS

### 🚨 CRÍTICO (Ação Imediata)

**C1 — `/api/debug-ai` expõe chaves de API publicamente**
- Arquivo: `src/app/api/debug-ai/route.ts`
- Problema: Endpoint GET público, sem autenticação, retorna `claude_key_prefix` (20 chars), `gemini_key_prefix` (15 chars), `gpt_key_prefix` (15 chars)
- Impacto: Exposição parcial de chaves de API em produção. Qualquer pessoa pode ver os prefixos e confirmar quais chaves estão ativas
- Ação: Remover em produção ou proteger com `ADMIN_PASSWORD` imediatamente

**C2 — `WHATSAPP_APP_SECRET` ausente bypassa verificação de assinatura**
- Arquivo: `src/app/api/whatsapp/route.ts`, linha 97-99
- Código: `if (!appSecret) return true; // sem secret configurado, aceita`
- Impacto: Se a env var não estiver configurada na Vercel, qualquer POST pode se passar por webhook da Meta e injetar mensagens na Jolie
- Ação: Confirmar que `WHATSAPP_APP_SECRET` está configurada na Vercel

**C3 — `CRON_SECRET` ausente deixa todos os crons expostos**
- Arquivo: Todos os `src/app/api/cron/*/route.ts`
- Código: `if (cronSecret && authHeader !== ...)` — se vazio, qualquer GET passa
- Impacto: Followup em massa, reativações e sync de Meta Ads podem ser disparados por qualquer pessoa
- Ação: Confirmar que `CRON_SECRET` está configurada na Vercel

### ⚠️ ALTO RISCO

**A1 — `/api/chat` sem autenticação — consumo irrestrito de IA**
- Endpoint público: POST sem auth, sem fingerprint além de IP
- Cadeia: Claude (primário) → Gemini → GPT → fallback
- Rate limit: 120 req/min por IP (facilmente contornável com IP rotation)
- Impacto: Custo alto em ataques de abuso; também expõe o sistema de prompts da Jolie

**A2 — `/api/meta-capi` sem autenticação — envenenamento de dados**
- Endpoint aceita qualquer evento CAPI sem validação de origem
- Impacto: Atacante pode injetar eventos `Purchase` falsos, inflando métricas do Meta Pixel e distorcendo otimização de campanhas

**A3 — Preços hardcoded em dois lugares com divergência**
- `src/app/api/whatsapp/route.ts` (linhas 53-71): tabela PRECOS com valores hardcoded
- Divergência: `pix_100` do Sedan Premium = R$499,80 no route.ts vs R$499,80 na tabela do skill
- Risco: Atualização de preço em um lugar não reflete no outro → cobrança incorreta via WhatsApp

**A4 — `node_modules` local em `src/app/api/whatsapp/`**
- Há uma pasta `node_modules` dentro do diretório da API do WhatsApp
- Causa: Provavelmente um `npm install` executado diretamente nessa pasta
- Impacto: Build imprevisível, versões conflitantes de dependências, aumento de bundle

### ℹ️ MÉDIO RISCO

**M1 — Migration `add_cashflow` sem timestamp**
- Nome: `prisma/migrations/add_cashflow/migration.sql` (sem timestamp)
- Risco: Em ambientes novos, a ordem de aplicação pode ser incorreta
- Ação: Renomear para `20260512000000_add_cashflow` (ou data real)

**M2 — Zoho Calendar não documentado em `.env.example`**
- `src/lib/zoho-calendar.ts` usa env vars não listadas no `.env.example`
- Risco: Desenvolvedor novo não sabe configurar; falha silenciosa em novos deploys

**M3 — `/api/chat` usa `claude-3-5-sonnet-latest` hardcoded**
- Modelo desatualizado (família 3.5)
- Disponível: `claude-sonnet-4-6` (família 4.x — muito mais capaz)
- Impacto: Qualidade de resposta inferior na Jolie do site vs. capacidade disponível

**M4 — Rate limit in-memory (middleware.ts) não sobrevive a múltiplas instâncias**
- `rateLimitStore` = `Map` em memória (`middleware.ts`, linha 12)
- Na Vercel (serverless), cada instância tem seu próprio Map
- Impacto: Rate limit ineficaz em produção com múltiplos cold starts

**M5 — Admin booking route não aparece no mapeamento (`/admin/reservas/[id]`)**
- Referenciada no código (`https://multitrip.com.br/admin/reservas/${b.id}`) mas rota não encontrada no mapeamento
- Verificar se existe ou se é dead link nas notificações

**M6 — `WHATSAPP_APP_SECRET` vs `WHATSAPP_TOKEN` — nomenclatura confusa**
- `WHATSAPP_TOKEN` = token de acesso à Meta API (para enviar mensagens)
- `WHATSAPP_APP_SECRET` = segredo do app para verificar assinaturas (diferente!)
- Ambos são críticos mas têm propósitos distintos; documentação pode confundir

---

## 7. FLUXO JOLIE — WHATSAPP (Detalhado)

```
Cliente envia msg
       │
       ▼
HMAC-SHA256 verify ──── FAIL (se APP_SECRET configurado) ──→ 403
       │
       ▼ OK
Upsert Lead (CRM) + TrackEvent("response")
       │
       ▼
Busca últimas 40 Interactions (histórico)
       │
       ▼
extrairEstadoConversa() via Gemini Flash
→ {data, pax, trajeto, tipoTrip}
       │
       ▼
callJolie():
  ├── loadJoliePromptFromDB() [JolieBrain] ou fallback JOLIE_SYSTEM
  ├── searchKnowledge() [pgvector RAG — top 5]
  ├── getClientMemory() [JolieClientMemory]
  └── buildDynamicPrompt() → systemPrompt completo
       │
       ▼
Gemini 2.0 Flash → (fallback) GPT-4o-mini → (fallback) estático
       │
       ▼
reply contém "GERAR_LINK_PAGAMENTO"?
       ├── SIM + dados completos → criarBookingWhats() → gerarLinkMP() → sendWhatsApp()
       │                         → learnFromConversion() [learning loop]
       ├── SIM + dados incompletos → intercepta → força coleta de dados
       └── NÃO → sendWhatsApp() normal
              └── detectarIntencao() → alertarEquipe() se quase_fechando/quer_humano
```

---

## 8. RESUMO EXECUTIVO

### Saúde Geral do Projeto: **7.5/10**

O projeto está em estado operacional sólido, com arquitetura bem pensada e integrações funcionais. Stack moderna, banco organizado com 16 models cobrindo todo o ciclo de negócio (CRM → Booking → Payment → Cashflow), e sistema Jolie com RAG + memória por cliente é diferenciado. Os problemas críticos encontrados são corrigíveis rapidamente.

### Top 5 Problemas Críticos

| # | Problema | Severidade | Impacto |
|---|---|---|---|
| 1 | `/api/debug-ai` expõe prefixos de chaves em produção | 🚨 CRÍTICO | Segurança — vazamento de API keys |
| 2 | `WHATSAPP_APP_SECRET` ausente bypassa verificação de assinatura | 🚨 CRÍTICO | Segurança — injeção no webhook WhatsApp |
| 3 | `CRON_SECRET` ausente deixa crons acessíveis publicamente | 🚨 CRÍTICO | Operacional — abuso de followup/sync |
| 4 | Preços hardcoded em dois lugares (route.ts + pricing.ts) | ⚠️ ALTO | Financeiro — cobrança divergente |
| 5 | `node_modules` local em `src/app/api/whatsapp/` | ⚠️ ALTO | Build — conflito de dependências |

### Sugestão de Sequência de Blocos

**BLOCO 2 — SEGURANÇA (PRIORIDADE MÁXIMA)**
Corrigir C1, C2, C3 antes de qualquer outro trabalho.
Estimativa: 2-3h de implementação.

**BLOCO 3 — QUALIDADE / MANUTENIBILIDADE**
Unificar tabela de preços, resolver `node_modules` local, atualizar modelo Claude no `/api/chat`, adicionar autenticação ao `/api/meta-capi`.

**BLOCO 4 — PERFORMANCE / ESCALA**
Substituir rate limit in-memory por Redis/Upstash, revisar cold starts, otimizar queries Prisma com paginação.

**BLOCO 5 — JOLIE INTELLIGENCE**
Evoluir RAG, calibrar learning loop, adicionar Claude à cadeia do WhatsApp como opção premium.

---

*Gerado em 2026-05-21 por Claude Sonnet 4.6 (Modo Supremo Jolie) — Read-only audit*
