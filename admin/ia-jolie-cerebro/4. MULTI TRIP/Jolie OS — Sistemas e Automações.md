# JOLIE OS — SISTEMAS E AUTOMAÇÕES
## Referência Técnica e Operacional
**Versão 1.0 — Mai/2026**

---

# 1. CRONS ATIVOS (vercel.json)

| Rota | Horário BRT | Função |
|---|---|---|
| `/api/cron/morning-briefing` | 07:00 diário | Briefing da equipe + reativação automática de leads |
| `/api/cron/followup` | 10:00 diário | Follow-up pós-reserva + reativação de leads frios |
| `/api/cron/birthday` | 07:00 diário | Parabéns para clientes aniversariantes |
| `/api/cron/alerts` | 09:00 e 17:00 diário | Alertas: leads parados · CPA · meta · sazonalidade |
| `/api/cron/weekly-report` | 20:00 domingo | Relatório semanal completo |
| `/api/cron/meta-ads` | 08:00 / 12:00 / 16:00 diário | Atualiza dados do Meta Ads |
| `/api/cron/google-ads` | 17:00 diário | Atualiza Google Ads (inativo até configurar credenciais) |
| `/api/cron/whatsapp-sync` | 11:00 diário | Sincroniza WhatsApp |
| `/api/cron/token-health` | 09:00 segunda | Verifica tokens das APIs |
| `/api/cron/email-followup` | 09:00 segunda | Follow-up por e-mail |
| `/api/cron/email-batch` | 08:30 / 12:00 / 14:00 / 17:00 | Envio de e-mails em lote |
| `/api/cron/backup` | 05:00 diário | Backup do banco de dados |

---

# 2. ROTAS DE GESTÃO ADMIN

| Rota | Método | Função |
|---|---|---|
| `/api/admin/jolie-analytics` | POST | Chat da Jolie Inteligência com dados reais (streaming) |
| `/api/admin/sync-leads` | POST | Sincroniza histórico: leads com reserva → "convertido" |
| `/api/admin/recalculate-scores` | POST | Recalcula score de todos os leads ativos |

> Autenticação via cookie de admin obrigatória.

---

# 3. SEQUÊNCIA DE FOLLOW-UP PÓS-RESERVA

**Arquivo:** `src/lib/followup.ts`
**Disparo:** cron `/api/cron/followup` às 10h BRT

```
D-1 de idaDate   → msgPreIN     — "Viagem amanhã, tudo confirmado"
D-1 de voltaDate → msgPreOUT    — "Partida amanhã, foi memorável?"
D+2 de voltaDate → msgPostTrip  — "Como foi a experiência?"
D+5 de voltaDate → msgGoogleReview — Link avaliação Google
D+14 de voltaDate → msgInstagram — Tag @multitrip.receptivo
D+35 de voltaDate → msgProximoDestino — Próximo destino (BLOQUEADO para afiliados)
```

**Reativação de leads frios:**
```
30 dias sem ação → mensagem de reengajamento
60 dias sem ação → mensagem sazonal
90 dias sem ação → última tentativa
```

---

# 4. SISTEMA DE SCORE DE LEADS

**Arquivo:** `src/lib/lead.ts` — função `recalculateLeadScore()`

**Bônus de perfil (não-cumulativos):**
```
+10  tem nome
+5   tem e-mail
+10  tem valor estimado
+5   passageiros > 1
+10  UTM source ou campaign preenchido
+20  origem paga (instagram_ads, facebook_ads, google_ads)
+15  tem data de viagem
+25  viagem em ≤14 dias (urgência alta)
+15  viagem em ≤30 dias (urgência média)
+ variável de eventos acumulados (page_view, response, checkout_start, purchase)
```

**Score → Status:**
```
≥ 150 → pronto
≥ 80  → quente
≥ 30  → interessado
< 30  → frio
```

---

# 5. ALERTAS — THRESHOLDS CONFIGURÁVEIS

**Variáveis de ambiente (Vercel):**
```
ALERT_CPA_MAX=100          # CPA máximo em R$ antes de disparar alerta
ALERT_BOOKING_TARGET=8     # Meta de reservas/mês para projeção
ALERT_LEAD_IDLE_HOURS=48   # Horas de inatividade para lead quente virar alerta
```

---

# 6. CLASSIFICAÇÃO DE CLIENTES

**Arquivo:** `src/app/admin/clientes/page.tsx` — função `classifyCustomer()`

```
👑 Embaixador → totalBookings ≥ 3 OU totalCents ≥ 150.000 (R$ 1.500)
⭐ VIP        → totalBookings ≥ 2 OU totalCents ≥ 80.000  (R$ 800)
🤎 Regular   → 1 reserva confirmada
```

---

# 7. CAPTURA DE UTMs

**Origem dos dados:**

| Canal | Como captura |
|---|---|
| Site / Checkout | `readAttribution()` do cookie `mt_aff` — lê `utm_source/medium/campaign/content/term` |
| WhatsApp orgânico | `source: "whatsapp"` |
| WhatsApp via anúncio (CTWA) | `message.referral.source_type === "ad"` → `source: "whatsapp_ad"`, utm_medium: "cpc" |
| Equipe (manual) | `source: "whatsapp_equipe"` |

---

# 8. CRUZAMENTO LEAD ↔ RESERVA

**Pontos de trigger (automático):**

1. Pagamento confirmado via Mercado Pago (webhook `/api/mp/webhook`)
2. Admin confirma reserva manualmente (`updateBookingStatus` → CONFIRMED)
3. Admin cria reserva manual paga (`createManualBooking` com isPaid=true)

**Lógica:**
```
telefone do cliente da reserva → normalizado (só dígitos)
↓
prisma.lead.update({ where: { whatsapp: phone }, data: { status: "convertido" } })
```

---

# 9. PAINEL DE INTELIGÊNCIA — ROTAS

| URL | Descrição |
|---|---|
| `/admin/leads` | Pipeline de leads com badge, KPIs, meses, origens |
| `/admin/clientes` | CRM de clientes recorrentes com LTV e classificação |
| `/admin/inteligencia` | Chat com a Jolie com dados reais em streaming |
| `/admin/tendencias` | Gráficos de 12 semanas, sazonalidade, canais |
| `/admin/caixa` | Fluxo de caixa com card "A Receber" interativo |
| `/admin/caixa/motoristas` | Relatório de repasses a motoristas |

---

# 10. GOOGLE ADS — PENDENTE

**Arquivo pronto:** `src/lib/google-ads.ts`
**Cron pronto:** `/api/cron/google-ads` (retorna `{ skipped: true }` sem credenciais)

**Para ativar — configurar no Vercel:**
```
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_REFRESH_TOKEN
GOOGLE_ADS_CUSTOMER_ID
```

**Guia completo:** `CHAVES.md` → seção "GOOGLE ADS"

---

# 11. RELATÓRIO SEMANAL — ESTRUTURA

**Disparo:** domingo 20h BRT → WhatsApp equipe

```
📊 RELATÓRIO SEMANAL — Multi Trip
📅 Semana: [data início] a [data fim]

LEADS
• Captados: X (±Y% vs semana anterior)
• Taxa de conversão: X%
• ⚠️ Leads quentes sem ação >48h: N

RESERVAS
• Confirmadas: X (±Y vs semana anterior)
• Faturamento: R$ X
• Ticket médio: R$ X

ADS
• Meta Ads: R$ X (CPA R$ X)
• Google Ads: R$ X (CPA R$ X) [quando configurado]
• CPA Total: R$ X

ANÁLISE JOLIE
[Análise contextualizada + 3 ações sugeridas]

👉 multitrip.com.br/admin
```

---

*Versão 1.0 — Mai/2026*
*Atualizar sempre que um cron, rota ou threshold for modificado*
