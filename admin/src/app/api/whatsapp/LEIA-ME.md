# WhatsApp Webhook — Jolie

Este diretório é o ponto de entrada único do WhatsApp na plataforma Multi Trip.

## Configuração necessária na Vercel

Adicione as seguintes variáveis de ambiente no painel da Vercel
(Settings → Environment Variables):

| Variável                       | Descrição                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `WHATSAPP_VERIFY_TOKEN`        | Token de verificação do webhook Meta (escolha qualquer string, ex: `multitrip_jolie_2026`) |
| `WHATSAPP_TOKEN`               | Token de acesso permanente da Meta API                                                     |
| `WHATSAPP_PHONE_ID`            | Phone Number ID do painel Meta for Developers                                              |
| `MP_ACCESS_TOKEN`              | Token do Mercado Pago (produção)                                                           |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chave da API Gemini (Google AI Studio)                                                     |
| `CRON_SECRET`                  | Secret para proteger `/api/cron/followup`                                                  |

## URL do webhook na Meta

Após o deploy, configure no Meta for Developers:

- **URL do Webhook:** `https://multitrip.com.br/api/whatsapp`
- **Verify Token:** o valor de `WHATSAPP_VERIFY_TOKEN`
- **Campos assinados:** `messages`

## Projeto antigo

O projeto `webhook-jolie` (Vercel Project ID: `prj_uxmK7xeokWRuEP06oW9HLpP1AR22`)
foi aposentado. Toda a lógica foi migrada para este arquivo.

Para desativar o projeto antigo: Vercel Dashboard → webhook-jolie → Settings → Delete Project.
