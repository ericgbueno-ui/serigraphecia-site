#!/usr/bin/env node

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");

const template = `# Neon / Postgres
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"

NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Mercado Pago
MP_ACCESS_TOKEN=""
MP_WEBHOOK_SECRET=""

# Auth interna
AFF_JWT_SECRET=""

# SEO / integracoes opcionais
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=""
NEXT_PUBLIC_META_PIXEL_ID=""
NEXT_PUBLIC_GA_ID=""
GOOGLE_PLACES_API_KEY=""
GOOGLE_PLACE_ID=""

# Notificacoes opcionais
RESEND_API_KEY=""
RESEND_FROM="Multi Trip <reservas@multitrip.com.br>"
NOTIFY_EMAIL_TO=""
WHATSAPP_WEBHOOK_URL=""
WHATSAPP_WEBHOOK_SECRET=""
`;

if (!existsSync(envPath)) {
  writeFileSync(envPath, template, { encoding: "utf8", flag: "wx" });
  console.log(".env.local criado com valores base de desenvolvimento.");
} else {
  console.log(".env.local ja existe. Nenhum arquivo foi sobrescrito.");
}

console.log("");
console.log("Proximos passos:");
console.log("1. Ajuste as credenciais no .env.local");
console.log("2. Rode `node scripts/check-env.mjs`");
console.log("3. Instale dependencias e execute o projeto");
