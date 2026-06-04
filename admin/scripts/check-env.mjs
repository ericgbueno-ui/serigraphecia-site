#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const localEnvKeys = loadLocalEnvFiles();
const isVercelPulledEnv = localEnvKeys.has("VERCEL_ENV");

const databaseUrl = firstValue("DATABASE_URL", "DATABASE_URL_NON_POOLING");
const siteUrl = firstValue("NEXT_PUBLIC_SITE_URL");
const mpToken = firstValue("MP_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN");
const mpWebhookSecret = (
  process.env.MP_WEBHOOK_SECRET ||
  process.env.MERCADOPAGO_WEBHOOK_SECRET ||
  ""
).trim();

const redisUrl = firstValue("REDIS_URL");
const whatsappToken = firstValue("WHATSAPP_TOKEN");
const whatsappPhoneId = firstValue("WHATSAPP_PHONE_ID");
const stripeKey = firstValue("STRIPE_KEY");
const mercadopagoToken = firstValue("MERCADOPAGO_TOKEN");
const gtmId = firstValue("GOOGLE_TAG_MANAGER_ID", "NEXT_PUBLIC_GTM_ID");
const metaPixelId = firstValue("META_PIXEL_ID", "NEXT_PUBLIC_META_PIXEL_ID");
const corsAllowedOrigins = firstValue("CORS_ALLOWED_ORIGINS");

const checks = [
  {
    name: "DATABASE_URL",
    required: true,
    description: "Conexao do Prisma (Neon / Postgres)",
    present: hasAny("DATABASE_URL", "DATABASE_URL_NON_POOLING"),
    warning: databaseUrl.startsWith("file:")
      ? "DATABASE_URL ainda aponta para SQLite. Para producao com Neon use uma URL postgresql://."
      : "",
  },
  {
    name: "POSTGRES_URL_NON_POOLING",
    required: false,
    description: "Conexao direta opcional para migracoes Prisma em Postgres",
    present: hasAny("POSTGRES_URL_NON_POOLING", "DATABSE_POSTGRES_URL_NON_POOLING"),
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    required: true,
    description: "URL publica do site",
    present: hasAny("NEXT_PUBLIC_SITE_URL"),
    warning:
      siteUrl && !siteUrl.startsWith("https://")
        ? "Mercado Pago exige NEXT_PUBLIC_SITE_URL publica em https:// para checkout e webhook."
        : "",
  },
  {
    name: "MP_ACCESS_TOKEN | MERCADOPAGO_ACCESS_TOKEN",
    required: false,
    description: "Token de pagamento do Mercado Pago",
    present: hasAny("MP_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN"),
  },
  {
    name: "MP_WEBHOOK_SECRET | MERCADOPAGO_WEBHOOK_SECRET",
    required: false,
    description: "Assinatura do webhook do Mercado Pago (recomendado)",
    present: hasAny("MP_WEBHOOK_SECRET", "MERCADOPAGO_WEBHOOK_SECRET"),
    warning:
      mpToken && !mpWebhookSecret
        ? "Configure a secret key do webhook para validar notificacoes do Mercado Pago."
        : "",
  },
  {
    name: "REDIS_URL",
    required: false,
    description: "Conexao Redis (BullMQ / cache)",
    present: hasAny("REDIS_URL"),
  },
  {
    name: "WHATSAPP_TOKEN",
    required: true,
    description: "Token da API do WhatsApp",
    present: hasAny("WHATSAPP_TOKEN"),
  },
  {
    name: "WHATSAPP_PHONE_ID",
    required: true,
    description: "Identificador do numero do WhatsApp",
    present: hasAny("WHATSAPP_PHONE_ID"),
  },
  {
    name: "STRIPE_KEY | MERCADOPAGO_TOKEN",
    required: true,
    description: "Gateway de pagamento principal",
    present: hasAny("STRIPE_KEY", "MERCADOPAGO_TOKEN", "MP_ACCESS_TOKEN"),
  },
  {
    name: "GOOGLE_TAG_MANAGER_ID | NEXT_PUBLIC_GTM_ID",
    required: true,
    description: "Identificador de rastreamento GTM",
    present: hasAny("GOOGLE_TAG_MANAGER_ID", "NEXT_PUBLIC_GTM_ID"),
  },
  {
    name: "META_PIXEL_ID | NEXT_PUBLIC_META_PIXEL_ID",
    required: true,
    description: "Identificador do Meta Pixel",
    present: hasAny("META_PIXEL_ID", "NEXT_PUBLIC_META_PIXEL_ID"),
  },
  {
    name: "CORS_ALLOWED_ORIGINS",
    required: false,
    description: "Lista de origens permitidas para CORS (separadas por virgula)",
    present: hasAny("CORS_ALLOWED_ORIGINS"),
    warning: !hasAny("CORS_ALLOWED_ORIGINS")
      ? "Recomendado definir CORS_ALLOWED_ORIGINS em producao para restringir acesso da API."
      : "",
  },
  {
    name: "RESEND_API_KEY",
    required: false,
    description: "Envio de notificacoes por email",
    present: hasAny("RESEND_API_KEY"),
  },
  {
    name: "ADMIN_ALERT_EMAIL",
    required: false,
    description: "Email que recebe alertas de token expirado (cron/token-health)",
    present: hasAny("ADMIN_ALERT_EMAIL"),
    warning: !hasAny("ADMIN_ALERT_EMAIL")
      ? "Recomendado: sem ADMIN_ALERT_EMAIL os alertas de token sao enviados para RESEND_FROM_EMAIL."
      : "",
  },
  {
    name: "ZOHO_CLIENT_ID | ZOHO_REFRESH_TOKEN",
    required: false,
    description: "Integracao Zoho Calendar (OAuth 2.0)",
    present: hasAny("ZOHO_CLIENT_ID") && hasAny("ZOHO_REFRESH_TOKEN"),
  },
  {
    name: "META_ADS_ACCESS_TOKEN",
    required: false,
    description: "Token Meta Ads (expira ~60 dias — renovar periodicamente)",
    present: hasAny("META_ADS_ACCESS_TOKEN"),
  },
  {
    name: "WHATSAPP_WEBHOOK_URL | WHATSAPP_CLOUD_TOKEN",
    required: false,
    description: "Canal de notificacao WhatsApp",
    present: hasAny("WHATSAPP_WEBHOOK_URL", "WHATSAPP_CLOUD_TOKEN"),
  },
];

let hasError = false;

console.log("Verificando variaveis de ambiente do projeto...\n");

for (const check of checks) {
  const status = check.present ? "OK" : check.required ? "ERRO" : "AVISO";
  console.log(`${status.padEnd(5)} ${check.name} - ${check.description}`);
  if (check.warning) {
    console.log(`      ${check.warning}`);
  }
  if (!check.present && check.required) hasError = true;
}

console.log("");
console.log(
  hasError
    ? "Configuracao incompleta. Preencha as variaveis obrigatorias antes do build/deploy."
    : "Configuracao valida para producao (checks obrigatorios atendidos)."
);

process.exit(hasError ? 1 : 0);

function loadLocalEnvFiles() {
  const keys = new Set();

  for (const fileName of [".env.local", ".env"]) {
    const filePath = join(process.cwd(), fileName);

    if (!existsSync(filePath)) continue;

    for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) continue;

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;

      const [, key, rawValue] = match;
      const value = normalizeEnvValue(rawValue);

      keys.add(key);

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }

  return keys;
}

function normalizeEnvValue(rawValue) {
  const value = rawValue.trim();

  if (!value) return "";

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value.replace(/\s+#.*$/, "").trim();
}

function firstValue(...keys) {
  for (const key of keys) {
    const value = (process.env[key] || "").trim();
    if (value) return value;
  }

  return "";
}

function hasAny(...keys) {
  return keys.some((key) => {
    const value = (process.env[key] || "").trim();

    return Boolean(value) || (isVercelPulledEnv && localEnvKeys.has(key));
  });
}
