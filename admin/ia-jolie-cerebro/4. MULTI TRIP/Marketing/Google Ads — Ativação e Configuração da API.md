# Google Ads — Ativação e Configuração da API
## Multi Trip | Integração com o JOLIE OS
**Status: Código pronto — aguardando credenciais**

---

# VISÃO GERAL

O sistema de Google Ads já está completamente codificado em:
- `src/lib/google-ads.ts` — biblioteca de integração REST
- `src/app/api/cron/google-ads/route.ts` — cron diário às 17h BRT

Enquanto as variáveis de ambiente não forem configuradas, o cron retorna `{ skipped: true }` silenciosamente — sem erros.

**Após configurar as 5 variáveis no Vercel → sistema ativa automaticamente.**

---

# PASSO A PASSO COMPLETO

## Passo 1 — Developer Token (acesso à API)

1. Acesse: [ads.google.com](https://ads.google.com)
2. Menu lateral → **Ferramentas → Centro de API**
3. Clique em **Solicitar acesso básico** (gratuito)
4. Após aprovação: copie o **Developer Token**

> Salvar em: `GOOGLE_ADS_DEVELOPER_TOKEN`

---

## Passo 2 — OAuth 2.0 (Client ID + Client Secret)

1. Acesse: [console.cloud.google.com](https://console.cloud.google.com)
2. Selecione ou crie um projeto
3. Vá em **APIs e Serviços → Biblioteca**
4. Busque e ative: **Google Ads API**
5. Vá em **APIs e Serviços → Credenciais**
6. Clique em **Criar credencial → ID do cliente OAuth 2.0**
7. Tipo: **Aplicativo da Web**
8. Em "URIs de redirecionamento autorizados" adicione:
   `https://developers.google.com/oauthplayground`
9. Clique em **Criar**
10. Copie **Client ID** e **Client Secret**

> Salvar em: `GOOGLE_ADS_CLIENT_ID` e `GOOGLE_ADS_CLIENT_SECRET`

---

## Passo 3 — Refresh Token (via OAuth Playground)

1. Acesse: [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. Clique em ⚙️ (configurações) no topo direito
3. Marque: **Use your own OAuth credentials**
4. Cole o **Client ID** e **Client Secret** do passo anterior
5. Feche as configurações
6. Em **Step 1 — Select & authorize APIs**, cole o escopo:
   ```
   https://www.googleapis.com/auth/adwords
   ```
7. Clique em **Authorize APIs**
8. Faça login com a conta Google que tem acesso ao Google Ads
9. Em **Step 2**, clique em **Exchange authorization code for tokens**
10. Copie o valor de **refresh_token**

> Salvar em: `GOOGLE_ADS_REFRESH_TOKEN`

---

## Passo 4 — Customer ID (ID da conta)

1. Acesse: [ads.google.com](https://ads.google.com)
2. No topo direito aparece o ID no formato: `XXX-XXX-XXXX`
3. Remova os hífens: resultado = `XXXXXXXXXX`

> Salvar em: `GOOGLE_ADS_CUSTOMER_ID`

---

# CONFIGURAR NO VERCEL

1. Acesse: [vercel.com/eric-buenos-projects/multitrip-site/settings/environment-variables](https://vercel.com/eric-buenos-projects/multitrip-site/settings/environment-variables)
2. Adicione as 5 variáveis:

```
GOOGLE_ADS_DEVELOPER_TOKEN = [valor do passo 1]
GOOGLE_ADS_CLIENT_ID       = [valor do passo 2]
GOOGLE_ADS_CLIENT_SECRET   = [valor do passo 2]
GOOGLE_ADS_REFRESH_TOKEN   = [valor do passo 3]
GOOGLE_ADS_CUSTOMER_ID     = [valor do passo 4, sem hífens]
```

3. Selecione os ambientes: **Production · Preview · Development**
4. Clique em **Save**
5. Faça um **Redeploy** para as variáveis entrarem em vigor

---

# O QUE PASSA A FUNCIONAR APÓS ATIVAR

| Funcionalidade | Onde |
|---|---|
| Cron diário de dados (17h BRT) | `/api/cron/google-ads` |
| Dados no relatório semanal | WhatsApp domingo 20h |
| CPA total (Meta + Google) | Relatório + Jolie Inteligência |
| Análise de campanhas pela Jolie | `/admin/inteligencia` |

---

# TAMBÉM ATUALIZAR NO .env.local (desenvolvimento)

```env
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
```

---

# ATENÇÃO — REFRESH TOKEN EXPIRA?

O refresh token do Google **não expira por padrão**, desde que:
- A conta continue com acesso ao Google Ads
- O app OAuth não seja revogado

Se um dia deixar de funcionar, basta repetir o **Passo 3** para gerar um novo refresh token.

---

# LOCALIZAÇÃO DO CÓDIGO

```
src/lib/google-ads.ts
→ fetchGoogleAdsInsights(startDate, endDate)
→ isGoogleAdsConfigured()

src/app/api/cron/google-ads/route.ts
→ GET — dispara diariamente, usa fetchGoogleAdsInsights()

src/app/api/cron/weekly-report/route.ts
→ Já integrado: se isGoogleAdsConfigured() = true, inclui no relatório

src/app/api/admin/jolie-analytics/route.ts
→ Já integrado: inclui Google Ads no contexto da Jolie
```

---

*Documento criado: Mai/2026*
*Status: aguardando conta Google Ads ativa + credenciais*
