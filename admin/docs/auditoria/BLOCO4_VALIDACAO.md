# BLOCO 4 — VALIDAÇÃO DE FLUXOS CRÍTICOS
**multitrip-site — Modo Supremo Jolie**
**Data:** 2026-05-21 | **Modo:** READ-ONLY | **Branch:** `auditoria-bloco3-20260521`

---

## RESUMO EXECUTIVO

| Fluxo | Status | Observação |
|---|---|---|
| 4.1 Reserva self-serve (site → MP) | ⚠️ Funciona com ressalvas | 2 gaps no CRM; depende de BLOCO 3 aplicado |
| 4.2 Painel admin | ⚠️ Funciona com ressalvas | Sem filtros/CSV; layout `/admin/reservas/[id]` existe |
| 4.3 Captura de leads | ✅ OK | Whitelist de tipos, salvamento OK, notificação OK |
| 4.4 APIs públicas | ✅ OK | Health+ping funcionais, erros sem stack trace |

---

## 4.1 — RESERVA SELF-SERVE

### Fluxo completo rastreado

```
[PASSO 1] /checkout → CheckoutClient.tsx
  ├── State inicializado: routeId=poa_gramado, trip=ida_volta, pax=sedan, pay=pix
  ├── Hidratação via sessionStorage (mt_transfer_v4) e searchParams ✅
  ├── Preço exibido via calcularTransfer() em tempo real ✅
  ├── Validações client-side: idaDate, voltaDate (se ida_volta), nome, whatsapp≥10 dígitos, acceptTerms ✅
  └── Loading state + botão disabled durante submissão ✅

[PASSO 2] POST /api/booking/public
  ├── Validação de enums (routeId, tripType, vehicleType, payMethod) [BLOCO 3 ✅]
  ├── Preço recalculado server-side via calcularTransfer() [BLOCO 3 ✅]
  ├── Customer.upsert por phone ✅
  ├── Booking.create com totalCents/depositCents/remainderCents autoritativos ✅
  ├── Afiliado: lookup por código case-insensitive + commissionCents calculado ✅
  └── Retorna: { success: true, bookingId, publicToken }

[PASSO 3] POST /api/mp/preference
  ├── Lookup booking por ID + publicToken (double-auth) ✅
  ├── Verifica status != CONFIRMED (evita duplo pagamento) ✅
  ├── Verifica contractAcceptedAt != null (aceite do contrato obrigatório) ✅
  ├── amountCents = pix ? depositCents : totalCents (valor do banco, não do cliente) ✅
  ├── Valida amountReais > 0 ✅
  └── Cria preference no MP + retorna checkoutUrl ✅

[PASSO 4] POST /api/mp/webhook (após pagamento)
  ├── Assinatura MP verificada (verifyMercadoPagoWebhookSignature) ✅
  ├── syncBookingFromMercadoPagoPaymentId() → atualiza status para CONFIRMED ✅
  ├── Notifica equipe (TEAM_WHATSAPP_NUMBER) com dados completos ✅
  ├── Cria evento Zoho Calendar ✅
  ├── Confirma cliente via Jolie (JOLIE_WHATSAPP_NUMBER) ✅
  └── markLeadConverted(phone, bookingId) [ver ressalva abaixo]
```

### Status: ⚠️ FUNCIONA COM RESSALVAS

| Ressalva | Severidade | Detalhe |
|---|---|---|
| **CRM gap** — cliente do site não cria Lead automaticamente | 🟡 IMPORTANTE | `/api/booking/public` cria Customer+Booking, mas não `upsertLead()`. Checkout direto (sem passar pelo WhatsApp) não aparece no painel de Leads. `markLeadConverted()` pode falhar silenciosamente se o Lead não existir. |
| **Seletor de veículo** — checkout assume `sedan` se acessado diretamente | 🟡 IMPORTANTE | `INITIAL.pax = "sedan"`. Cliente que acessa `/checkout` sem query params (`?pax=van`) verá preço de sedan por padrão. Sem UI para trocar veículo dentro do checkout. |

### Correção recomendada para CRM gap

```typescript
// Em /api/booking/public — logo após criar o Customer:
import { upsertLead } from "@/lib/lead";

await upsertLead({
  whatsapp: customer.phone,
  name: customer.name,
  source: "site_checkout",
}).catch(() => {}); // não-bloqueante
```

---

## 4.2 — PAINEL ADMIN

### Auth testada (análise estática)

```
POST /admin (loginAction — Server Action)
  ├── timingSafeEqual para comparação de senha (timing-safe) ✅
  ├── Se ADMIN_PASSWORD vazio → redirect para /admin?error=1 (falha segura) ✅
  ├── Cookie: httpOnly, sameSite=lax, secure=true em produção ✅
  ├── TTL: 8h ✅
  └── HMAC-SHA256 derivado da senha → deriva sempre igual, sem estado de sessão ✅

GET /admin/reservas (e qualquer /admin/* além da login page)
  ├── requireAdmin() → getIsAdmin() → verifyAdminToken() ✅
  └── Se não autenticado → redirect("/admin") ✅
```

### Listagem de reservas

```
/admin/reservas
  ├── Carrega TODOS os bookings (sem paginação) ✅ funciona, mas...
  ├── Ordenação: createdAt DESC ✅
  ├── Campos: id, status, tripType, vehicleType, customer, idaDate, totalCents, payMethod ✅
  ├── Filtros por data/status: ❌ NÃO EXISTE (só listagem plana)
  └── Exportação CSV: ❌ NÃO EXISTE
```

### Status: ⚠️ FUNCIONA COM RESSALVAS

| Ressalva | Severidade | Detalhe |
|---|---|---|
| **Sem filtros** | 🟡 IMPORTANTE | Com escala, a listagem de todos os bookings sem paginação pode ser lenta. Sem filtro por data/status na UI — operador precisa rolar para encontrar reservas. |
| **Sem CSV** | 🟢 MELHORIA | Exportação CSV seria útil para o controle operacional. |
| **Paginação** | 🟡 IMPORTANTE | `prisma.booking.findMany()` sem `take`/`skip` — 100+ bookings podem causar timeout de função serverless. |
| **`/admin/reservas/[id]`** | ✅ OK | Rota existe em `src/app/admin/reservas/[id]/page.tsx`. Link nas notificações válido. |

---

## 4.3 — CAPTURA DE LEADS

### /api/lead/event

```
POST /api/lead/event
  ├── ALLOWED_TYPES whitelist (page_view, whatsapp_click, quote_request, checkout_start, no_response) ✅
  ├── Sem whatsapp + tipo != page_view → { ok: true, skipped: true } (graceful) ✅
  ├── upsertLead() → cria ou atualiza Lead no banco ✅
  ├── trackLeadEvent() → cria LeadEvent com tipo + meta ✅
  └── Try/catch com log — sem stack trace na resposta ✅
```

### /api/abandonment

```
POST /api/abandonment
  ├── Verifica body.whatsapp || body.nome antes de enviar ✅
  ├── sendAbandonmentWebhook(data) — envia dado bruto ao webhook ⚠️
  └── Sem validação de schema (Zod) — dados não sanitizados chegam ao webhook
```

### Status: ✅ OK (com nota menor)

| Nota | Severidade | Detalhe |
|---|---|---|
| Abandonment sem validação | 🟢 MELHORIA | Dados brutos do body vão direto para o webhook externo. Baixo risco (não persiste no banco), mas poderia injetar dados malformados no webhook. |

---

## 4.4 — APIs PÚBLICAS

### /api/health

```
GET /api/health
  ├── prisma.affiliate.count() — testa conectividade com Neon ✅
  ├── validateCriticalEnvVars() — verifica todas as env vars críticas ✅
  │    Críticas: DATABASE_URL, ADMIN_PASSWORD, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID,
  │              WHATSAPP_VERIFY_TOKEN, MP_ACCESS_TOKEN
  │    Segurança: WHATSAPP_APP_SECRET, ADM_AUTH_SECRET, CRON_SECRET
  │    Funcionais: GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY, NEXT_PUBLIC_SITE_URL
  └── Retorna: { ok, affiliates, env: { ok, missing, warnings } }
```

Qualidade: ✅ Excelente — health check funcional que expõe estado real do sistema.

### /api/ping

```
GET /api/ping → resposta simples { ok: true }
```

### Padrão de erros

✅ Nenhuma rota pública expõe stack traces. Todas retornam JSON com campo `error` em português, sem detalhes técnicos internos.

### Status: ✅ OK

---

## ACHADOS NOVOS (não documentados no BLOCO 2)

| # | Severidade | Arquivo | Problema | Impacto |
|---|---|---|---|---|
| B4-1 | 🟡 IMPORTANTE | `src/app/api/booking/public/route.ts` | Cliente do site não cria Lead no CRM — gap entre Customer e Lead models | CRM incompleto — conversões do site não aparecem no painel de leads |
| B4-2 | 🟡 IMPORTANTE | `src/app/admin/reservas/page.tsx` | `findMany()` sem paginação — pode timeout com 100+ bookings | Operacional — admin lento/quebrado com escala |
| B4-3 | 🟢 MELHORIA | `src/app/api/abandonment/route.ts` | Dados brutos enviados ao webhook sem sanitização | Baixo risco — sem persistência no banco |

---

## RESULTADO FINAL DO BLOCO 4

| Fluxo | Resultado | Bloqueadores para produção |
|---|---|---|
| 4.1 Reserva self-serve | ⚠️ Funciona — 2 ressalvas | Nenhum bloqueador. CRM gap é melhoria importante. |
| 4.2 Painel admin | ⚠️ Funciona — 2 ressalvas | Paginação pode ser problema com crescimento. |
| 4.3 Captura de leads | ✅ OK | Nenhum. |
| 4.4 APIs públicas | ✅ OK | Nenhum. |

**Recomendação:** Prosseguir para BLOCO 5 (Otimizações SEO + Performance + UX). Os fluxos críticos funcionam — as ressalvas são melhorias, não bloqueadores de produção.

---

*Gerado em 2026-05-21 por Claude Sonnet 4.6 (Modo Supremo Jolie) — Read-only*
