export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ ENV obrigatória não definida: ${name}`);
  }
  return value;
}

/**
 * Valida variáveis de ambiente críticas na inicialização.
 * Não lança exceção — apenas loga warnings para não derrubar o app.
 * Chame isto na rota /api/health ou no layout raiz.
 */
export function validateCriticalEnvVars(): { ok: boolean; missing: string[]; warnings: string[] } {
  const REQUIRED = [
    "DATABASE_URL",
    "ADMIN_PASSWORD",
    "WHATSAPP_TOKEN",
    "WHATSAPP_PHONE_ID",
    "WHATSAPP_VERIFY_TOKEN",
    "MP_ACCESS_TOKEN",
  ];

  const SECURITY_CRITICAL = [
    "WHATSAPP_APP_SECRET",    // Sem isso, webhook aceita spoofing
    "ADM_AUTH_SECRET",         // Necessário para sessões de afiliados
    "CRON_SECRET",             // Sem isso, crons são públicos
  ];

  const FUNCTIONAL = [
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SITE_URL",
  ];

  const missing = REQUIRED.filter((k) => !process.env[k]);
  const warnings: string[] = [];

  for (const k of SECURITY_CRITICAL) {
    if (!process.env[k]) {
      warnings.push(`SECURITY: ${k} não definida — risco de segurança`);
      console.warn(`[env] ⚠️ SECURITY: ${k} não definida`);
    }
  }

  for (const k of FUNCTIONAL) {
    if (!process.env[k]) {
      warnings.push(`FUNCIONAL: ${k} não definida — funcionalidade degradada`);
      console.warn(`[env] ⚠️ FUNCIONAL: ${k} não definida`);
    }
  }

  for (const k of missing) {
    console.error(`[env] ❌ CRÍTICA: ${k} não definida — app pode falhar`);
  }

  return { ok: missing.length === 0, missing, warnings };
}
