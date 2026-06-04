#!/usr/bin/env bash
# backup-secrets-guide.sh
#
# Guia de quais variáveis críticas precisam ser salvas em local seguro.
# NÃO executa nada — apenas lista e orienta.
# Guarde os valores em: 1Password, Bitwarden, ou Vault criptografado.

echo "🔐 GUIA DE BACKUP — Credenciais Críticas Multitrip"
echo "=================================================="
echo ""
echo "Salve os valores abaixo em um gerenciador de senhas seguro."
echo "Fonte: Painel Vercel > Settings > Environment Variables"
echo ""

echo "━━━ DATABASE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DATABASE_URL                  → Neon (conexão pooling)"
echo ""

echo "━━━ EMAIL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESEND_API_KEY                → Painel Resend > API Keys"
echo ""

echo "━━━ WHATSAPP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  WHATSAPP_TOKEN                → Meta for Developers"
echo "  WHATSAPP_PHONE_ID             → Meta for Developers"
echo "  WHATSAPP_APP_SECRET           → Meta for Developers"
echo ""

echo "━━━ ZOHO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ZOHO_CLIENT_ID                → Zoho API Console"
echo "  ZOHO_CLIENT_SECRET            → Zoho API Console"
echo "  ZOHO_REFRESH_TOKEN            → Gerado via OAuth (não expira se usado regularmente)"
echo "  ZOHO_CALENDAR_ID              → ID do calendário no Zoho"
echo ""

echo "━━━ GOOGLE AI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GEMINI_API_KEY                → Google AI Studio"
echo "  GOOGLE_GENERATIVE_AI_API_KEY  → Google AI Studio"
echo ""

echo "━━━ META / FACEBOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  META_CAPI_ACCESS_TOKEN        → Meta Events Manager"
echo "  META_ADS_ACCESS_TOKEN         → Meta Business Suite (expira ~60 dias)"
echo "  META_ADS_ACCOUNT_ID           → Meta Ads Manager"
echo ""

echo "━━━ SEGURANÇA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CRON_SECRET                   → Gerado por você (manter secreto)"
echo "  ADMIN_PASSWORD                → Senha do painel admin"
echo ""

echo "━━━ ATENÇÃO: TOKENS COM EXPIRAÇÃO ━━━━━━━━━━━━━━━"
echo "  META_ADS_ACCESS_TOKEN         → Expira em ~60 dias"
echo "                                   Renove em: developers.facebook.com/tools/explorer"
echo ""
echo "  WHATSAPP_TOKEN                → Pode expirar — monitore em Meta for Developers"
echo ""
echo "  ✅ ZOHO_REFRESH_TOKEN não expira enquanto for usado regularmente"
echo "     Se ficar 30+ dias sem uso, será invalidado."
echo ""
echo "━━━ COMO RENOVAR META_ADS_ACCESS_TOKEN ━━━━━━━━━━"
echo "  1. Acesse developers.facebook.com/tools/explorer"
echo "  2. Selecione seu App e gere um token com permissões: ads_read, ads_management"
echo "  3. Clique em 'Extend Access Token' para gerar token de longa duração (~60 dias)"
echo "  4. Atualize META_ADS_ACCESS_TOKEN no Vercel: vercel env rm META_ADS_ACCESS_TOKEN"
echo "     vercel env add META_ADS_ACCESS_TOKEN"
echo ""
echo "=================================================="
echo "✅ Mantenha esses valores atualizados no seu gerenciador de senhas."
