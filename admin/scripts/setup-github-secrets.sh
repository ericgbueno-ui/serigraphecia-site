#!/usr/bin/env bash
# setup-github-secrets.sh
#
# Configura os GitHub Secrets necessários para o workflow youtube_sync.yml
#
# PRÉ-REQUISITO: gh CLI autenticado (gh auth login) e valores em mão
#
# USO:
#   GOOGLE_GENERATIVE_AI_API_KEY="sua_chave" \
#   OPENAI_API_KEY="sua_chave" \
#   DATABASE_URL="postgresql://..." \
#   bash scripts/setup-github-secrets.sh

set -euo pipefail

REPO="ericgbueno-ui/multitrip-site"

echo "🔐 Configurando GitHub Secrets para: $REPO"
echo ""

required_vars=(
  "GOOGLE_GENERATIVE_AI_API_KEY"
  "OPENAI_API_KEY"
  "DATABASE_URL"
)

missing=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "❌ Variáveis obrigatórias não definidas:"
  for v in "${missing[@]}"; do
    echo "   $v"
  done
  echo ""
  echo "Execute novamente com as variáveis definidas. Exemplo:"
  echo ""
  echo "  GOOGLE_GENERATIVE_AI_API_KEY=\"AIza...\" \\"
  echo "  OPENAI_API_KEY=\"sk-...\" \\"
  echo "  DATABASE_URL=\"postgresql://...\" \\"
  echo "  bash scripts/setup-github-secrets.sh"
  exit 1
fi

for var in "${required_vars[@]}"; do
  echo -n "  Setting $var... "
  echo "${!var}" | gh secret set "$var" --repo "$REPO"
  echo "✅"
done

echo ""
echo "✅ Secrets configurados com sucesso!"
echo ""
echo "Verifique em: https://github.com/$REPO/settings/secrets/actions"
