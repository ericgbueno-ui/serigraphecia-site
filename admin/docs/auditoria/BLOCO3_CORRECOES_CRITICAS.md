# BLOCO 3 — CORREÇÕES CRÍTICAS (BLOCKERs + CRÍTICOs)
**multitrip-site — Modo Supremo Jolie**
**Data:** 2026-05-21 | **Branch:** `auditoria-bloco3-20260521` | **Build:** ✅ VERDE

---

## RESULTADO FINAL

| Métrica | Valor |
|---|---|
| BLOCKERs corrigidos | 4 / 4 |
| CRÍTICOs corrigidos | 3 / 5 |
| CRÍTICOs documentados (sem correção de código) | 2 / 5 |
| `tsc --noEmit` | ✅ 0 erros |
| `npm run build` | ✅ 47 rotas, 0 erros |
| Commits na branch | 3 commits |

---

## CORREÇÕES APLICADAS

### 🔴 BLOCKER 1 — debug-ai expõe chaves API
**Status:** ✅ JÁ CORRIGIDO (commit `e0f0169` — antes deste bloco)
**Arquivo:** `src/app/api/debug-ai/route.ts`
**Solução:** `getIsAdmin()` guard implementado na linha 7 — retorna 401 para não-admins.
**Verificação:** Endpoint requer cookie `mt_admin_token` válido antes de qualquer execução.

---

### 🔴 BLOCKER 2 — HMAC bypass WhatsApp
**Status:** ✅ CORRIGIDO — commit `d93fba5`
**Arquivo:** `src/app/api/whatsapp/route.ts:97`

**Antes:**
```typescript
const appSecret = process.env.WHATSAPP_APP_SECRET;
if (!appSecret) return true; // sem secret configurado, aceita (compatibilidade)
```

**Depois:**
```typescript
const appSecret = process.env.WHATSAPP_APP_SECRET;
if (!appSecret) return false; // env var ausente → nega (fail-closed)
```

**Por quê:** Fail-open é inaceitável em webhook de segurança. Se a env var não estiver configurada na Vercel, qualquer POST seria aceito como legítimo. Agora a ausência de `WHATSAPP_APP_SECRET` bloqueia todos os webhooks — forçando o operador a configurar a var antes de usar.

**⚠️ Ação manual obrigatória:** Confirmar que `WHATSAPP_APP_SECRET` está configurada na Vercel. Sem ela, o webhook WhatsApp fica offline até a var ser adicionada.

---

### 🔴 BLOCKER 3 — CRON_SECRET bypass (4 rotas)
**Status:** ✅ CORRIGIDO — commit `d93fba5`
**Arquivos:** `cron/followup`, `cron/birthday`, `cron/meta-ads`, `cron/jolie`

**Antes (em todas):**
```typescript
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) { // passa se cronSecret vazio
```

**Depois:**
```typescript
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) { // exige a var E correspondência
```

**Por quê:** `if (cronSecret && ...)` é lógica de "só valido SE a var existir". Com var vazia, a condição era sempre falsa → qualquer GET passava. O padrão correto é exigir a var E verificar o header.

**⚠️ Ação manual obrigatória:** Confirmar que `CRON_SECRET` está configurada na Vercel. Todos os 5 cron jobs ficam offline até a var ser configurada.

---

### 🔴 BLOCKER 4 — Preço controlado pelo cliente
**Status:** ✅ CORRIGIDO — commit `d93fba5`
**Arquivo:** `src/app/api/booking/public/route.ts:115-120`

**Antes:**
```typescript
const totalCents = Math.round(parseFloat(body?.totalCents) || 0);
const depositCents = Math.round(parseFloat(body?.depositCents) || 0);
const remainderCents = Math.round(parseFloat(body?.remainderCents) || 0);
// → salvo no banco sem validação → link MP gerado com esse valor
```

**Depois:**
```typescript
// Validação de enums antes de qualquer cálculo
if (!CANONICAL_ROUTES.includes(routeId) || !isTripType(tripType) ||
    !isPaxTier(vehicleType) || !isPayMethod(payMethod)) { → 400 }

// Preço calculado server-side — valores do cliente ignorados
const computed = calcularTransfer({ pax: vehicleType, tripType, payMethod, routeId, addons });
const totalCents = Math.round(computed.total * 100);
const depositCents = payMethod === "pix" ? Math.round(totalCents / 2) : totalCents;
const remainderCents = totalCents - depositCents;
```

**Por quê:** Exploit direto: `POST /api/booking/public { totalCents: 1, ... }` criava booking com R$0,01 e gerava link Mercado Pago válido. Agora o preço é sempre autoritativo do servidor, derivado de `calcularTransfer()` do `pricing.ts`.

---

### 🟠 CRÍTICO 7 — Tabela de preços duplicada e divergente
**Status:** ✅ CORRIGIDO — commit `6e0b4f5`
**Arquivo:** `src/app/api/whatsapp/route.ts`

**Antes:** Objeto `PRECOS` hardcoded (140+ linhas) com valores incorretos:
- Sedan Executivo cartão: R$783.20 no PRECOS vs R$781.26 no pricing.ts
- Spin cartão: R$1005.24 no PRECOS vs R$1005.26 no pricing.ts

**Depois:**
```typescript
import { calcularTransfer, type PaxTier, type PayMethod } from "@/lib/pricing";

const VEHICLE_NAME_TO_TIER: Record<string, PaxTier> = {
  "Sedan Premium":    "sedan",
  "Spin 6 lugares":  "van",
  "Sedan Executivo": "executivo",
  "SUV":             "suv",
  "SUV Elétrico":    "suv_eletrico",
};

// Em gerarLinkMP():
const computed = calcularTransfer({ pax: paxTier, tripType: "ida_volta", payMethod, routeId });
const fullPriceCents = Math.round(computed.total * 100);
```

**Por quê:** Uma única fonte de verdade (`pricing.ts`) elimina a possibilidade de divergência futura. Qualquer atualização de preço agora reflete automaticamente em todos os canais.

---

### 🟠 CRÍTICO 9 — meta-capi sem validação de eventName
**Status:** ✅ CORRIGIDO — commit `6e0b4f5`
**Arquivo:** `src/app/api/meta-capi/route.ts`

**Antes:**
```typescript
if (!eventName || !eventId) { → 400 }
// qualquer eventName passava
```

**Depois:**
```typescript
const ALLOWED_EVENTS = new Set(["PageView", "ViewContent", "InitiateCheckout",
  "AddPaymentInfo", "Purchase", "Lead", "Contact", "CompleteRegistration", ...]);

if (!eventName || !eventId || !ALLOWED_EVENTS.has(eventName)) { → 400 }
```

**Por quê:** O endpoint é público por design (chamado pelo browser). Mas sem whitelist, qualquer ator malicioso podia injetar `Purchase` falsos e distorcer a otimização de campanhas. A whitelist bloqueia eventos não-reconhecidos sem afetar o fluxo legítimo.

---

### 🟠 CRÍTICO 8 — node_modules local em src/app/api/whatsapp/
**Status:** ✅ CORRIGIDO — remoção manual
**Diretório removido:** `src/app/api/whatsapp/node_modules/`

**Conteúdo removido:** `@neondatabase`, `@types`, `obuf`, `pg-int8`, `pg-numeric`, `pg-protocol`, `pg-types`, `postgres-array`, `postgres-bytea`, `postgres-date`, `postgres-interval`, `postgres-range`, `undici-types`

**Por quê:** Pacotes de banco de dados (pg, neon) instalados erroneamente dentro de um diretório de API. Não havia `package.json` local — foram instalados diretamente. Conflitavam com as versões do package.json raiz e aumentavam o bundle de forma imprevisível. Build continua verde após remoção.

---

## ITENS NÃO CORRIGIDOS NESTE BLOCO

### 🟠 CRÍTICO 5 — /api/chat sem autenticação
**Motivo:** Rate limit in-memory não é a causa raiz — é o CRÍTICO 6. A proteção real seria via IP fingerprint mais robusto ou token de sessão. Sem Redis disponível confirmado, uma mudança incompleta pode piorar a situação. Documentado para BLOCO 5.

**Mitigação atual:** Rate limit de 120 req/min por IP no middleware — ineficaz com IP rotation, mas presente.

### 🟠 CRÍTICO 6 — Rate limit in-memory ineficaz na Vercel
**Motivo:** Requer Redis/Upstash para ser corrigido adequadamente. Mudança de infraestrutura fora do escopo do BLOCO 3.

**Risco atual:** Médio — a Vercel rotaciona instâncias, cada uma tem seu próprio Map. Em prática, o rate limit só funciona por instância, não por usuário real em escala.

**Solução recomendada:** Adicionar `@upstash/ratelimit` + `@upstash/redis` e substituir `rateLimitStore` no middleware.

---

## AÇÕES MANUAIS OBRIGATÓRIAS (antes do próximo deploy)

| Ação | Urgência | Detalhe |
|---|---|---|
| Configurar `WHATSAPP_APP_SECRET` na Vercel | 🔴 CRÍTICO | Sem ela, todos os webhooks WhatsApp são rejeitados (fail-closed agora) |
| Configurar `CRON_SECRET` na Vercel | 🔴 CRÍTICO | Sem ela, todos os 5 crons são bloqueados |
| Testar webhook WhatsApp após deploy | 🔴 CRÍTICO | Validar que HMAC está funcionando com a Meta |
| Verificar `CORS_ALLOWED_ORIGINS` na Vercel | 🟠 IMPORTANTE | Confirmar que lista de origins não está vazia |

---

## HASH DOS COMMITS

| Commit | Descrição |
|---|---|
| `d93fba5` | fix(security): corrigir 4 BLOCKERs críticos de segurança |
| `6e0b4f5` | fix(security): unificar tabela de preços e whitelist de eventos CAPI |
| `049ed80` | docs(auditoria): adicionar BLOCO2_TECNICA com scorecard e 23 achados |

---

## SCORECARD PÓS-BLOCO 3

| Categoria | Antes | Depois | Delta |
|---|---|---|---|
| **Security** | 4/10 | **7/10** | +3 |
| **Build Health** | 7/10 | **7/10** | = |
| **Performance** | 6/10 | 6/10 | = |
| **SEO** | 8/10 | 8/10 | = |
| **UX** | 8/10 | 8/10 | = |

---

*Gerado em 2026-05-21 por Claude Sonnet 4.6 (Modo Supremo Jolie)*
*Branch: `auditoria-bloco3-20260521` | Sem push automático*
