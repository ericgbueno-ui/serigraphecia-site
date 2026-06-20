# Mapeamento do Painel Administrativo — Relatório de Inventário

Este documento apresenta o inventário completo de páginas, rotas, APIs, menus, layouts, middlewares e proteção de páginas do painel administrativo.

---

## 1. Páginas & Rotas Existentes
O painel administrativo está localizado sob a pasta `/admin` e utiliza o Next.js App Router.

- **Login Administrativo:**
  - `/admin`
- **Operação:**
  - `/admin/nova-reserva` — Criação manual de contratos
  - `/admin/agenda` — Visualização da agenda/calendário de transfers
  - `/admin/reservas` — Listagem de contratos/reservas
  - `/admin/reservas/[id]` — Visualização de detalhes de uma reserva específica
  - `/admin/reservas/[id]/editar` — Edição dos dados da reserva
  - `/admin/motoristas` — Gestão da frota e motoristas parceiros
  - `/admin/motoristas/novo` — Cadastro de novo motorista parceiro
- **Comercial:**
  - `/admin/painel/whatsapp` — QR code para conexão ao WhatsApp CRM
  - `/admin/b2b` — CRM comercial para captação de agências parceiras
  - `/admin/afiliados` — Listagem e gestão de afiliados
  - `/admin/afiliados/novo` — Cadastro de novo afiliado
  - `/admin/afiliados/[id]` — Detalhes e métricas do afiliado
- **Inteligência:**
  - `/admin/leads` — Pipeline de leads capturados pelo WhatsApp/site
  - `/admin/leads/[id]` — Detalhes do lead e histórico de conversas com a Jolie/IA
  - `/admin/clientes` — Listagem e ficha dos clientes que já compraram
  - `/admin/inteligencia` — Customização do prompt mestre e comportamento da Jolie
  - `/admin/tendencias` — Análise de conversão e insights gerados por IA
  - `/admin/analytics` — Métricas de faturamento, volume e canais
- **Gestão:**
  - `/admin/caixa` — Fluxo de caixa e conciliação de receitas/despesas
  - `/admin/caixa/ads` — Controle de gasto diário do tráfego pago (Meta Ads)
  - `/admin/caixa/anual` — DRE analítico anual
  - `/admin/caixa/motoristas` — Despesas financeiras por motorista parceiro
  - `/admin/marketing` — Gestão de campanhas e UTMs
  - `/admin/automacoes` — Criação de regras de automação (e-mail, WhatsApp, status)
  - `/admin/automacoes/novo` — Nova automação em lote
  - `/admin/automacoes/[id]` — Ficha da automação
  - `/admin/automacoes/canvas/[id]` — Editor visual da sequência de passos
- **Outros:**
  - `/admin/conversas` — Histórico consolidado de chat

---

## 2. APIs do Painel Administrativo

As APIs estão em `src/app/api/...` e realizam integrações, crons e operações internas:

- **Automações:**
  - `/api/admin/automacoes` (GET/POST)
  - `/api/admin/automacoes/templates` (GET)
  - `/api/admin/automacoes/[id]` (GET/PUT/DELETE)
  - `/api/admin/automacoes/[id]/run` (POST)
  - `/api/automacoes/webhook/[token]` (POST)
- **CRM B2B:**
  - `/api/admin/b2b/contacts` (GET/POST)
  - `/api/admin/b2b/contacts/[id]` (GET/PUT/DELETE)
  - `/api/admin/b2b/import` (POST)
- **Histórico & Chat:**
  - `/api/admin/conversas/[id]` (GET/POST)
- **Campanhas de E-mail (Resend):**
  - `/api/admin/email/batch-jobs` (GET/POST)
  - `/api/admin/email/batch-jobs/[id]` (GET/PUT/DELETE)
  - `/api/admin/email/batch-jobs/[id]/trigger` (POST)
  - `/api/admin/email/campaigns` (GET/POST)
  - `/api/admin/email/campaigns/[id]` (GET/PUT/DELETE)
  - `/api/admin/email/campaigns/[id]/followup` (POST)
  - `/api/admin/email/campaigns/[id]/preview` (GET)
  - `/api/admin/email/campaigns/[id]/send` (POST)
  - `/api/admin/email/config-status` (GET)
  - `/api/admin/email/preview` (POST)
- **Métricas & Inteligência:**
  - `/api/admin/analytics` (GET)
  - `/api/admin/jolie-analytics` (GET)
  - `/api/admin/leads` (GET)
  - `/api/admin/marketing/audience-count` (POST)
  - `/api/admin/marketing/send` (POST)
  - `/api/admin/recalculate-scores` (POST)
  - `/api/admin/sync-leads` (POST)
- **WhatsApp Web (Baileys):**
  - `/api/admin/whatsapp/connect` (GET/POST) — QR Code, pairing code, check status
  - `/api/admin/whatsapp/sync` (POST) — Sincronização manual
  - `/api/admin/whatsapp-test` (POST)
- **Financeiro / Caixa:**
  - `/api/cashflow/balance/monthly` (GET)
  - `/api/cashflow/transaction` (POST/DELETE)
  - `/api/cashflow/transactions` (GET)
- **Crons Automatizados:**
  - `/api/cron/alerts`
  - `/api/cron/automacoes`
  - `/api/cron/backup`
  - `/api/cron/birthday`
  - `/api/cron/email-batch`
  - `/api/cron/email-followup`
  - `/api/cron/followup`
  - `/api/cron/google-ads`
  - `/api/cron/jolie`
  - `/api/cron/meta-ads`
  - `/api/cron/morning-briefing`
  - `/api/cron/token-health`
  - `/api/cron/weekly-report`
  - `/api/cron/whatsapp-sync`
- **Saúde & Ping:**
  - `/api/health`
  - `/api/health/meta`
  - `/api/ping`
  - `/api/whatsapp` (Webhook WhatsApp Cloud API)

---

## 3. Menus e Links Internos
Controlados centralmente pelo componente client-side `AdminShell.tsx`.

- **Menu Fixo:**
  - `/admin/painel` — Central / Dashboard Principal
- **Seção OPERAÇÃO:**
  - `/admin/nova-reserva` — Novo Contrato
  - `/admin/agenda` — Agenda
  - `/admin/reservas` — Contratos
  - `/admin/motoristas` — Motoristas / Frota
- **Seção COMERCIAL:**
  - `/admin/painel/whatsapp` — WhatsApp CRM
  - `/admin/b2b` — CRM B2B
  - `/admin/afiliados` — Afiliados
- **Seção INTELIGÊNCIA:**
  - `/admin/leads` — Leads & Pipeline
  - `/admin/clientes` — Clientes
  - `/admin/inteligencia` — Jolie Inteligência
  - `/admin/tendencias` — Tendências
  - `/admin/analytics` — Analytics
- **Seção GESTÃO:**
  - `/admin/caixa` — Financeiro
  - `/admin/marketing` — Marketing
  - `/admin/automacoes` — Automações

---

## 4. Middleware & Proteção de Páginas

A segurança é imposta em dois níveis:

1. **Next.js Middleware (`admin/middleware.ts`):**
   - Intercepta todas as rotas combinadas no padrão `/admin/**` e `/api/admin/**` (exceto `/admin` puro).
   - Valida a presença e integridade do cookie `mt_admin_token` contra o hash derivado do segredo `ADMIN_PASSWORD`.
   - Se o token for inválido, redireciona o usuário imediatamente para a página de login `/admin`.
   
2. **Helpers do Servidor (`admin/src/lib/server/adminAuth.ts`):**
   - Função `requireAdmin()` executa `cookies()` e valida no escopo do Server Component, forçando o redirecionamento com `redirect('/admin')` caso a sessão seja nula ou expirada.
