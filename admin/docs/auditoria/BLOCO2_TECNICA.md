# BLOCO 2 — AUDITORIA TÉCNICA PROFUNDA
**multitrip-site — Modo Supremo Jolie**
**Data:** 2026-05-21 | **Auditor:** Claude Sonnet 4.6 | **Modo:** READ-ONLY

---

## RESULTADOS DOS DIAGNÓSTICOS AUTOMATIZADOS

| Diagnóstico | Resultado | Detalhe |
|---|---|---|
| `npm run build` | ✅ **CLEAN** | 47 rotas geradas, 0 erros, 0 warnings |
| `tsc --noEmit` | ✅ **CLEAN** | 0 erros de TypeScript |
| `npm run lint` | ⚠️ **2 ERROS** | 2 erros reais no src/ + 85 falsos-positivos (worktrees/build não ignorados) |
| `prisma migrate status` | ✅ **UP TO DATE** | 11 migrations aplicadas |
| `.env` em git history | ✅ **SEGURO** | Commit `d66a493` contém só `.env.example`, não `.env` real |

---

## TABELA COMPLETA DE ACHADOS

| # | Severidade | Arquivo | Linha | Problema | Impacto |
|---|---|---|---|---|---|
| 1 | 🔴 BLOCKER | `src/app/api/debug-ai/route.ts` | 9, 37, 77 | GET público sem autenticação retorna `claude_key_prefix` (20 chars), `gemini_key_prefix` (15 chars), `gpt_key_prefix` (15 chars) de chaves de API | Segurança — vazamento de credenciais em produção |
| 2 | 🔴 BLOCKER | `src/app/api/whatsapp/route.ts` | 97-99 | `if (!appSecret) return true` — se `WHATSAPP_APP_SECRET` não configurado, verificação HMAC bypassa completamente | Segurança — injeção arbitrária no webhook WhatsApp |
| 3 | 🔴 BLOCKER | `src/app/api/cron/*/route.ts` | 18-25 (todos) | `if (cronSecret && authHeader !== ...)` — se `CRON_SECRET` vazio na Vercel, todos os 5 crons são públicos | Operacional — abuso de followups, reativação e sync ads |
| 4 | 🔴 BLOCKER | `src/app/api/booking/public/route.ts` | 115-116 | `totalCents` e `depositCents` aceitos do body do cliente sem validação contra tabela de preços server-side. MP usa esses valores do banco. | **Financeiro** — cliente pode criar booking com R$0,01 e obter link de pagamento válido do Mercado Pago |
| 5 | 🟠 CRÍTICO | `src/app/api/chat/route.ts` | 24-53 | POST público sem autenticação. Cadeia Claude → Gemini → GPT. Rate limit in-memory de 120/min por IP. | Custo de IA — abuso com IP rotation drena créditos Anthropic + Gemini + OpenAI |
| 6 | 🟠 CRÍTICO | `middleware.ts` | 12 | `rateLimitStore = new Map()` em memória. Na Vercel (serverless), cada instância tem seu próprio Map separado | Rate limit ineficaz em produção — proteção ilusória contra abuso |
| 7 | 🟠 CRÍTICO | `src/app/api/whatsapp/route.ts` | 53-71 | Tabela de preços `PRECOS` hardcoded e diferente dos valores em `src/lib/pricing.ts` | Financeiro — divergência entre preço cobrado via WhatsApp e preço do site |
| 8 | 🟠 CRÍTICO | `src/app/api/whatsapp/` (pasta) | — | `node_modules` local dentro de `src/app/api/whatsapp/node_modules/` — pg-protocol, @types/node, undici-types, pg-int8 presentes | Build — versões conflitantes, bundle aumentado, comportamento imprevisível |
| 9 | 🟠 CRÍTICO | `src/app/api/meta-capi/route.ts` | 1-37 | POST público sem autenticação aceita eventos CAPI arbitrários (eventName, eventId, customData, userData) | Meta Ads — envenenamento de dados, injeção de Purchase falsos, distorção de ROI de campanhas |
| 10 | 🟡 IMPORTANTE | `src/app/globals.css` | 1 | Fontes carregadas via `@import url("https://fonts.googleapis.com/css2?...")` — Cormorant Garamond + DM Sans. Não usa `next/font` | Performance — render blocking, DNS extra, sem self-hosting, CLS potencial, GDPR (LGPD) — transferência de dados a terceiro sem opt-in |
| 11 | 🟡 IMPORTANTE | `src/app/components/*.tsx` (30 arquivos) | 1 | Todos os 30 componentes da pasta `/components` são `"use client"`. Vários (Footer, BenefitsSection, HowItWorksSection, StatsSection) são estaticamente renderizáveis sem JS | Performance — JS desnecessário enviado ao cliente, hidratação inútil, Time to Interactive maior |
| 12 | 🟡 IMPORTANTE | `src/app/api/booking/public/route.ts` | 107-112 | Campos `routeId`, `tripType`, `vehicleType`, `payMethod` validados apenas com `safeStr()` — sem enum whitelist, sem Zod | Segurança — valores inválidos chegam ao banco sem rejeição; ex: `vehicleType: "../../etc/passwd"` é truncado mas persiste no DB |
| 13 | 🟡 IMPORTANTE | `src/app/api/chat/route.ts` | 39 | Modelo hardcoded: `"claude-3-5-sonnet-latest"` (família 3.5). Disponível: `claude-sonnet-4-6` (família 4.x) | Qualidade — Jolie do site usa IA inferior à disponível para o mesmo custo |
| 14 | 🟡 IMPORTANTE | `prisma/migrations/add_cashflow/` | — | Migration sem timestamp no nome da pasta (`add_cashflow` vs `20260512_add_cashflow`). Migrations são aplicadas em ordem alfabética — pode quebrar em redeployment limpo | Operacional — migration pode ser aplicada fora de ordem em novos ambientes |
| 15 | 🟡 IMPORTANTE | `.env.example` | — | Variáveis Zoho Calendar ausentes (usadas em `src/lib/zoho-calendar.ts`). Arquivos `AUDITORIA_INTEGRACAO_ZOHO_CALENDAR.md` e `ESPECIFICACAO_IMPLEMENTACAO_ZOHO_SYNC.md` foram commitados no git e depois removidos | Operacional — novos devs não conseguem configurar Zoho; histórico do git pode expor lógica interna |
| 16 | 🟡 IMPORTANTE | `src/app/api/booking/public/route.ts` | 192 | `id: \`bk_${Date.now()}\`` — ID de booking gerado com timestamp. Em condições de alta concorrência (ex: múltiplos clientes no mesmo milissegundo), IDs podem colidir | Operacional — colisão improvável mas possível; melhor usar `cuid()` como os outros models |
| 17 | 🟢 MELHORIA | `package.json` | — | Prisma 5.22.0 disponível → 7.8.0 (major). Breaking changes na major — requer migration guide | Manutenção — versão significativamente desatualizada |
| 18 | 🟢 MELHORIA | `src/app/page.tsx` | 43-70 | Schema.org JSON-LD presente ✅ mas incompleto: falta `address`, `geo`, `openingHours`, `priceRange`, `aggregateRating` no `LocalBusiness` | SEO — rich results do Google (estrelas, horário) não aparecem sem esses campos |
| 19 | 🟢 MELHORIA | `src/app/page.tsx` | — | `Header`, `Footer`, `TrustBar`, `StatsSection` são client components mas não usam nenhum hook de estado ou eventos — candidatos a server components | Performance — bundle do homepage aumentado desnecessariamente |
| 20 | 🟢 MELHORIA | `src/app/api/chat/route.ts` | 207-225 | Endpoint `/api/chat` não valida schema do `messages` array — se cliente enviar `messages: null` ou formato inválido, o `map()` lança erro não tratado antes do try/catch externo | Estabilidade — crash previsível com payload malformado |
| 21 | 🟡 IMPORTANTE | `src/app/admin/AdminShell.tsx` | 23-25 | `useEffect(() => { setMenuOpen(false); }, [pathname])` — `setState` síncrono dentro de effect. React reporta como potencial cascading render. | Performance/React — warning de lint real; pode causar render duplo no admin |
| 22 | 🟡 IMPORTANTE | `src/app/admin/caixa/page.tsx` | 435 | Aspas `"` não escapadas em JSX (`&quot;` ausente) — 2 ocorrências | Lint bloqueante — impede `npm run lint` de passar no CI |
| 23 | 🟡 IMPORTANTE | `eslint.config.mjs` | — | ESLint não ignora `.claude/worktrees/` nem arquivos `.next/build/` — escaneia worktrees de agentes e turbopack runtime, inflando o total de 87 erros (85 são falsos-positivos de arquivos gerados) | DevX — lint inutilizável no CI; tempo de execução desnecessariamente longo |

---

## ANÁLISE DETALHADA POR CATEGORIA

### 1. BUILD HEALTH

```
Build: ✅ CLEAN
├── 47 rotas compiladas sem erros
├── TypeScript: 0 erros
├── ESLint: 0 warnings
├── Turbopack utilizado (dev e build) — velocidade boa
└── Warning: "Using edge runtime on a page currently disables static generation"
    → Verificar se algum route usa edge runtime desnecessariamente
```

**Observação crítica sobre build**: O script de build roda `prisma migrate resolve --rolled-back 20260518140502_jolie_brain_rag` e depois `prisma migrate deploy` a cada build. Isso significa que a migration `jolie_brain_rag` é marcada como "rolled back" em cada build e reaplicada. Isso é um hack do `scripts/migrate-resolve.mjs` — potencialmente perigoso em produção se a migration mudar.

### 2. SEGURANÇA

#### S1 — BLOCKER: Endpoint de debug expõe chaves API
```
GET /api/debug-ai → resposta pública:
{
  "claude_key_present": true,
  "claude_key_prefix": "sk-ant-api03-XXXXXXXXXXX...",  // 20 chars
  "gemini_key_present": true,
  "gemini_key_prefix": "AIzaSyXXXXXXX...",            // 15 chars
  "gpt_key_present": true,
  "gpt_key_prefix": "sk-proj-XXXXXXX...",              // 15 chars
  "active_engine": "claude",
  "engines_available": ["claude", "gemini", "gpt"]
}
```
Com 15-20 chars do prefixo, um atacante pode verificar se as chaves são ativas em seus próprios projetos.

#### S2 — BLOCKER: Preço controlado pelo cliente
```typescript
// src/app/api/booking/public/route.ts:115
const totalCents = Math.round(parseFloat(body?.totalCents) || 0);
const depositCents = Math.round(parseFloat(body?.depositCents) || 0);
// → salvo no banco sem validação
// → /api/mp/preference usa booking.depositCents do banco
```
**Exploit**: `POST /api/booking/public` com `totalCents: 1` → booking salvo com R$0,01 → `POST /api/mp/preference` gera link Mercado Pago para R$0,005. Reserva confirmada por menos de R$0,01.

#### S3 — CORS avaliado
O CORS está configurado no middleware e verifica `allowedOrigins`. Porém, se `NEXT_PUBLIC_SITE_URL` ou `CORS_ALLOWED_ORIGINS` não estiverem configuradas em produção, a lista de origins permitidas pode ficar vazia ou só conter os defaults. Verificar na Vercel.

#### S4 — Headers de segurança
CSP configurado em `next.config.js` com: `default-src 'self'`, `script-src` controlado, `object-src 'none'`, `upgrade-insecure-requests`, HSTS em produção. **✅ Bom nível de configuração.**

### 3. PERFORMANCE

#### P1 — Google Fonts bloqueante
```css
/* src/app/globals.css:1 */
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..500;9..600;9..700&display=swap");
```
- Custo: DNS lookup extra + round-trip para fonts.googleapis.com antes de renderizar
- `@import` no CSS é **síncrono e bloqueante** — pior do que `<link>` no `<head>`
- `next/font` resolveria: self-hosting automático, zero layout shift, melhor LCP

#### P2 — 30 Client Components (30/30 na pasta /components)
```
Header, Footer, BenefitsSection, HowItWorksSection, StatsSection,
TestimonialsSection, ExperienceUpgradeSection, TrustBar, RotaRomantica,
UrgenciaBanner → nenhum desses usa hooks de estado ou eventos interativos
```
Cada `"use client"` força download de JS adicional e hidratação no browser. Para componentes puramente visuais, isso é desperdício. Estimativa: **80-120KB** de JS desnecessário na homepage.

#### P3 — Imagens
- `next/image` usado corretamente em todos os componentes ✅
- `formats: ["image/avif", "image/webp"]` configurado ✅
- Cache de imagens: `Cache-Control: public, max-age=31536000, immutable` ✅

### 4. SEO

| Item | Status | Observação |
|---|---|---|
| `robots.txt` | ✅ | Bloqueia `/checkout`, `/pagamento`, `/afiliado`, `/api`, `/admin` |
| `sitemap.xml` | ✅ | Gerado dinamicamente com prioridades corretas |
| Metadata em todas as páginas | ✅ | `layout.tsx` + todas as rotas públicas têm `metadata` |
| `canonical` URLs | ✅ | Home, transfer e slug pages têm `alternates.canonical` |
| OpenGraph | ✅ | Configurado em todas as páginas públicas com imagem 1200×630 |
| JSON-LD Schema.org | ⚠️ | Existe em `/` e `/transfer`, mas `LocalBusiness` incompleto — sem `address`, `geo`, `openingHours`, `aggregateRating` |
| `next/font` | ❌ | Fonts via `@import` CSS — sem self-hosting |
| noindex em admin | ✅ | `robots.txt` bloqueia `/admin` + middleware redireciona não autenticados |
| Heading hierarchy | ✅ | H1 → H2 → H3 seguem hierarquia correta nas páginas analisadas |
| Páginas transacionais bloqueadas | ✅ | `/checkout`, `/pagamento/*` não estão no sitemap e estão no robots disallow |

### 5. UX E CONVERSÃO

#### Checkout em 3 Passos — Avaliação
```
PASSO 1: "Quando você chega?"     → data, tipo de trip, voo ✅
PASSO 2: "Quem estamos buscando?" → nome*, WhatsApp*, email (opcional), direitos imagem ✅
PASSO 3: "Como você prefere pagar?" → PIX/Cartão, termos, CTA final ✅
```

| Item | Status | Observação |
|---|---|---|
| Fluxo progressivo (3 passos) | ✅ | Passo desabilitado até anterior completar |
| CTA final | ✅ | "Garantir minha reserva — R$499,80" — valor dinâmico |
| PIX vs. Cartão | ✅ | "50% agora + 50% no check-in" bem explicado, desconto percentual mostrado |
| Loading state | ✅ | `loading ? "Processando…"` + `disabled` no botão |
| Erros humanizados | ✅ | Mensagens em pt-BR sem stack trace |
| Sticky price bar mobile | ✅ | Aparece no passo 3 com resumo e CTA |
| Validação de WhatsApp | ✅ | Mínimo 10 dígitos verificado no client e server |
| Consentimento de imagem obrigatório | ✅ | Bloqueante — sim/não antes de avançar |
| **WhatsApp CTAs concorrentes** | ⚠️ | Em `/transfer`, `/faq`, homepage — vários CTAs WhatsApp competem com self-serve |
| **Seletor de veículo ausente no checkout** | ⚠️ | "Seletor de veículo removido pois a escolha já foi feita na página inicial" — cliente que chega direto no `/checkout` não vê seleção de veículo (assume `sedan`) |
| Touch targets mobile | ✅ | Botões com `py-3` a `py-5` — ≥44px |
| Overflow horizontal | ✅ | `overflow-x-hidden` no body + componentes |

---

## SCORECARD FINAL

| Categoria | Score | Justificativa |
|---|---|---|
| **Build Health** | **7/10** | Build limpo, 0 erros TS, mas lint reporta 2 erros reais + `.claude/worktrees` não ignorado infla falsos-positivos; hack de migration no build script |
| **Security** | **4/10** | 4 BLOCKERs ativos: debug expõe chaves, HMAC bypass, crons públicos, preço controlado pelo cliente |
| **Performance** | **6/10** | next/image correto, CSP bom, mas Google Fonts blocking + 30 client components desnecessários |
| **SEO** | **8/10** | robots/sitemap/metadata/canonical corretos; JSON-LD incompleto |
| **UX** | **8/10** | Checkout premium bem estruturado; WhatsApp CTAs disputam atenção com self-serve |
| **Conversão** | **7/10** | Fluxo excelente até o CTA; BLOCKER financeiro (preço pelo cliente) pode causar chargeback reverso |

---

## RESUMO EXECUTIVO DO BLOCO 2

### BLOCKERs Encontrados: **4**

1. `/api/debug-ai` — expõe prefixos de chaves de API (segurança)
2. `WHATSAPP_APP_SECRET` bypass — injeção no webhook (segurança)
3. `CRON_SECRET` bypass — crons públicos (operacional)
4. **Preço controlado pelo cliente** — booking com R$0,01 → link MP válido (financeiro) ← **NOVO**

### Os 3 Problemas Mais Graves

| Rank | Problema | Por que é o mais grave |
|---|---|---|
| 🥇 1 | Preço controlado pelo cliente (`/api/booking/public`) | Exploração financeira direta e automatizável — qualquer pessoa pode criar reservas por R$0,01 e obter link de pagamento real. Impacto financeiro imediato. |
| 🥈 2 | `/api/debug-ai` público | Em produção agora — qualquer pessoa pode ver prefixos das chaves Anthropic, Gemini e OpenAI. |
| 🥉 3 | HMAC bypass do WhatsApp | Se `WHATSAPP_APP_SECRET` não estiver na Vercel, toda a inteligência da Jolie pode ser injetada com mensagens falsas — spoofing completo. |

### Tempo Estimado de Correção

| Severidade | Quantidade | Estimativa | Prioridade |
|---|---|---|---|
| 🔴 BLOCKER | 4 problemas | **4-6 horas** | Imediato — antes do próximo deploy |
| 🟠 CRÍTICO | 5 problemas | **6-8 horas** | Esta semana |
| 🟡 IMPORTANTE | 6 problemas | **8-12 horas** | Próximo sprint |
| 🟢 MELHORIA | 5 problemas | **4-6 horas** | Backlog |

**Total estimado: 22-32 horas de desenvolvimento.**

---

*Gerado em 2026-05-21 por Claude Sonnet 4.6 (Modo Supremo Jolie) — Read-only audit*
*Baseado em: npm build, tsc --noEmit, eslint, inspeção manual de 40+ arquivos*
