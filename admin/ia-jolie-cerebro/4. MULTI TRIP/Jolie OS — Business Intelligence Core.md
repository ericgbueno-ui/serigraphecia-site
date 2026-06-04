# JOLIE OS — SUPREME BUSINESS INTELLIGENCE CORE
## Sistema Operacional Inteligente da Multi Trip Receptivos e Viagens
**Versão 3.0 — Concluído Mai/2026 | Eric Bueno + Claude**

---

# 1. MISSÃO DO SISTEMA

A Jolie OS é o sistema central de inteligência da Multi Trip.

Transforma dados brutos em decisões inteligentes:

| Entrada | Saída |
|---|---|
| Leads captados | Conversão rastreada e automatizada |
| Campanhas rodando | ROI real por anúncio |
| Reservas confirmadas | Faturamento por origem + alertas imediatos |
| Comportamento do cliente | Nutrição automática e personalizada |
| Operação diária | Briefing matinal + gargalos detectados |

A Jolie atua como: **CRM inteligente · analista comercial · analista de marketing · supervisora operacional · consultora estratégica · sistema de alertas · concierge pós-venda**

---

# 2. REGRA FUNDAMENTAL — CONVERSÃO REAL

> **Conversão NÃO é mover um lead no funil.**
> **Conversão É um lead gerar uma reserva confirmada.**

**Critério oficial:**
```
telefone do lead = telefone da reserva confirmada
→ Badge automático: ✓ Reserva Confirmada
→ Status do lead atualizado para: "convertido"
```

---

# 3. HIERARQUIA DE IA — IMUTÁVEL

```
1º Gemini (primário)
   ↓ se falhar
2º Claude (fallback 1)
   ↓ se falhar
3º ChatGPT (fallback 2)
   ↓ se todos falharem
   Resposta estática de segurança
```

**Aplicado em:** WhatsApp da Jolie · Briefing matinal · Reativação de leads · Jolie Inteligência

---

# 4. STATUS DO SISTEMA — TODAS AS FASES CONCLUÍDAS

| Fase | Entrega | Status |
|---|---|---|
| **1** | Leads por mês · badge conversão automático · KPIs reais | ✅ |
| **2** | Pipeline de dados · contexto para Jolie · JOLIE OS no cérebro | ✅ |
| **3** | Relatório semanal automático (domingo 20h WA) | ✅ |
| **4** | Jolie Inteligência — chat com dados reais (/admin/inteligencia) | ✅ |
| **5** | Google Ads foundation · UTMs capturados em todo o funil | ✅ |
| **6** | Tendências — 12 semanas · sazonalidade · canais (/admin/tendencias) | ✅ |
| **7** | Alertas em tempo real 2x/dia via WhatsApp | ✅ |
| **8** | Briefing diário 7h · Jolie reativa leads automaticamente | ✅ |
| **9** | Follow-up pós-reserva por datas reais (D-1/D+2/D+5/D+14/D+35) | ✅ |
| **10** | CRM Clientes Recorrentes — LTV · Embaixador/VIP (/admin/clientes) | ✅ |

**Google Ads:** código pronto, aguarda credenciais (`GOOGLE_ADS_*` no `.env`)

---

# 5. ESTRUTURA DE DADOS INTEGRADOS

| Fonte | Tipo | Status |
|---|---|---|
| CRM Leads | Comercial | ✅ Ativo |
| Bookings / Reservas | Receita | ✅ Ativo |
| Meta Ads | Marketing | ✅ Ativo |
| Google Ads | Marketing | 🔧 Aguarda credenciais |
| Site / Checkout | Comportamento + UTMs | ✅ Ativo |
| WhatsApp | Conversão + Reativação | ✅ Ativo |
| Meta Pixel | Retargeting | ✅ Ativo |
| Google Analytics | Navegação | 🔧 Não integrado |

---

# 6. LEADS — REGRAS OPERACIONAIS

**Score automático** (0–100+):

| Critério | Pontos |
|---|---|
| Tem nome | +10 |
| Tem e-mail | +5 |
| Tem valor estimado | +10 |
| Passageiros > 1 | +5 |
| UTM preenchido | +10 |
| Origem paga (Meta/Google Ads) | +20 |
| Tem data de viagem | +15 |
| Viagem em ≤14 dias (urgência alta) | +25 |
| Viagem em ≤30 dias (urgência média) | +15 |
| Eventos acumulados (response, checkout_start, etc.) | variável |

**Status automático por score:**
- ≥ 150 → Pronto
- ≥ 80 → Quente
- ≥ 30 → Interessado
- < 30 → Frio

**Origens válidas:**
`whatsapp` · `whatsapp_equipe` · `whatsapp_ad` · `checkout` · `site` · `abandonment` · `indicação` · `manual`

---

# 7. CLASSIFICAÇÃO DE CLIENTES

| Classe | Critério | Ação |
|---|---|---|
| 👑 Embaixador | 3+ viagens OU R$ 1.500+ gastos | Tratamento premium personalizado |
| ⭐ VIP | 2+ viagens OU R$ 800+ gastos | Atenção especial + benefícios |
| 🤎 Regular | 1 viagem confirmada | Nutrição para recompra |

**Badge AGÊNCIA:** clientes com `affiliateCode` preenchido — a agência parceira cuida da relação.

---

# 8. ALERTAS AUTOMÁTICOS

**Cron:** 2x/dia — 9h e 17h BRT

| Gatilho | Threshold | Ação |
|---|---|---|
| Lead quente parado | > 48h sem ação | WhatsApp equipe com lista |
| CPA acima da meta | > R$ 100 (configurável) | Alerta + sugestão de ação |
| Dias sem reserva | ≥ 5 dias | WhatsApp urgência comercial |
| Projeção abaixo da meta | < 8 reservas/mês (configurável) | Alerta na metade do mês |
| Alta temporada chegando | Jul / Nov / Dez / Jan | Aviso 10 dias antes |

**Env vars:** `ALERT_CPA_MAX` · `ALERT_BOOKING_TARGET` · `ALERT_LEAD_IDLE_HOURS`

---

# 9. BRIEFING DIÁRIO — 7H BRT

Todo dia de manhã a Jolie envia no WhatsApp da equipe (Rita e Eric):

```
☀️ BOM DIA, RITA E ERIC!

🚗 OPERAÇÃO DE HOJE
→ Lista de viagens com motorista, horário, voo, hotel, saldo a cobrar

📊 META DO MÊS
→ Barra de progresso visual

🤖 JOLIE REATIVOU X LEADS
→ Leads com histórico: mensagem enviada automaticamente

📝 LEADS P/ VOCÊ ENTRAR EM CONTATO
→ Leads sem histórico: texto pronto para copiar/enviar
```

**Lógica de reativação:**
- Lead tem histórico com a Jolie → Claude gera mensagem personalizada → enviada automaticamente
- Lead sem histórico → Claude gera mensagem → Eric envia manualmente

---

# 10. FOLLOW-UP PÓS-RESERVA

Sequência automática baseada nas **datas reais de viagem** (não na data de reserva):

| Gatilho | Destinatário | Mensagem |
|---|---|---|
| D-1 de `idaDate` | Todos | Lembrete chegada IN — "Viagem amanhã, tudo confirmado" |
| D-1 de `voltaDate` | Ida+Volta | Lembrete partida OUT — "Partida amanhã, foi memorável?" |
| D+2 de `voltaDate` | Todos | "Como foi a experiência na Serra?" (NPS) |
| D+5 de `voltaDate` | Todos | Pedido de avaliação Google (link direto) |
| D+14 de `voltaDate` | Todos | Instagram — marcar foto, comentar posts @multitrip.receptivo |
| D+35 de `voltaDate` | **Sem afiliado** | "Qual destino te faz brilhar os olhos?" → agência |

> ⚠️ **D+35 NUNCA é enviado para clientes de agências parceiras (affiliateCode preenchido).**

---

# 11. ALERTA DE RESERVA CONFIRMADA

Mensagem completa enviada para Rita e Eric no momento do pagamento:

```
🎉 RESERVA CONFIRMADA — SITE/WHATSAPP 🤎

CLIENTE
👤 Nome · 📱 Telefone

VIAGEM
🗺️ Trecho · 🚗 Veículo · X passageiros
🏨 Hotel
✈️ In: data às horário · voo
🛫 Out: data às horário · voo

FINANCEIRO
💰 Total · ✅ Pago (método) · ⏳ Saldo no check-in

EXTRAS (se houver)
• Rota Romântica / Recepção / Cadeirinha / etc.

🔗 multitrip.com.br/admin/reservas/...
```

---

# 12. CONSULTAS INTELIGENTES — JOLIE ANALYTICS

Acesse: `multitrip.com.br/admin/inteligencia`

A Jolie responde com dados reais em tempo real:

- *"Como foi esta semana?"*
- *"Quais leads devo priorizar hoje?"*
- *"Qual é nosso CPA atual?"*
- *"Como está a meta do mês?"*
- *"Temos leads quentes parados?"*
- *"Qual campanha está trazendo mais resultado?"*

---

# 13. PAINEL DE GESTÃO — MENU ADMIN

```
⚡ Central

OPERAÇÃO
  ＋ Nova Reserva
  🗓️ Reservas
  🚙 Motoristas / Frota

COMERCIAL
  💬 WhatsApp CRM
  💼 CRM B2B
  🤝 Afiliados

INTELIGÊNCIA
  🎯 Leads & Pipeline
  🤎 Clientes
  🧠 Jolie Inteligência
  📈 Tendências
  📊 Analytics

GESTÃO
  💰 Financeiro
  📣 Marketing
```

---

# 14. AÇÕES ÚNICAS PÓS-DEPLOY

Executar uma vez após cada deploy:

```
POST multitrip.com.br/api/admin/sync-leads
→ Sincroniza histórico: leads que têm reserva viram "convertido"

POST multitrip.com.br/api/admin/recalculate-scores
→ Recalibra scores de todos os leads com a nova lógica
```

---

# 15. INTELIGÊNCIA HISTÓRICA

A Jolie aprende continuamente com:

- Sazonalidade da Serra Gaúcha (Jul/Nov/Dez/Jan = alta · Mar/Mai = baixa)
- Campanhas vencedoras por período
- Padrões de conversão por canal
- Perfis de clientes Embaixadores

> **Precisão aumenta com o tempo.** Com 6+ meses de dados, as análises da Jolie se tornam preditivas — não apenas descritivas.

---

# 16. VISÃO FINAL

A Jolie não é apenas uma IA de atendimento.

Ela é o **sistema nervoso central da Multi Trip** — vendo tudo, alertando sobre o que importa, agindo proativamente, nutrindo clientes automaticamente e aprendendo continuamente.

**Resultado esperado:**
- Cada decisão baseada em dados reais
- Zero leads quentes perdidos por falta de atenção
- Clientes nutridos automaticamente da reserva até a próxima viagem
- Rita e Eric acordam todo dia com o plano do dia pronto

---

*Versão 3.0 — Concluído Mai/2026*
*Próxima revisão: quando Google Ads for configurado ou aos 6 meses de dados históricos*
