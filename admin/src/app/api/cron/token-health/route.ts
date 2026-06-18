/**
 * GET /api/cron/token-health
 *
 * Valida a saúde dos tokens de Zoho e Meta Ads.
 * Roda semanalmente (segunda, 9h BRT).
 * Envia alerta por email se qualquer token estiver inválido.
 *
 * Proteção: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { getZohoToken } from "@/lib/zoho-calendar";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

interface TokenResult {
  service: string;
  ok: boolean;
  detail: string;
}

async function checkZohoToken(): Promise<TokenResult> {
  try {
    const token = await getZohoToken();
    if (!token) {
      return { service: "Zoho", ok: false, detail: "getZohoToken retornou vazio — refresh_token pode ter expirado ou credenciais inválidas." };
    }
    return { service: "Zoho", ok: true, detail: "Token renovado com sucesso." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { service: "Zoho", ok: false, detail: msg };
  }
}

async function checkMetaToken(): Promise<TokenResult> {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  if (!token) {
    return { service: "Meta Ads", ok: false, detail: "META_ADS_ACCESS_TOKEN não configurado." };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`,
      { cache: "no-store" }
    );
    const json = await res.json();

    if (json.error) {
      return { service: "Meta Ads", ok: false, detail: json.error.message ?? JSON.stringify(json.error) };
    }

    const data = json.data ?? {};
    if (!data.is_valid) {
      return { service: "Meta Ads", ok: false, detail: "Token inválido ou expirado." };
    }

    const expiresAt: number = data.expires_at ?? 0;
    if (expiresAt > 0) {
      const daysLeft = Math.floor((expiresAt * 1000 - Date.now()) / 86_400_000);
      if (daysLeft < 14) {
        return {
          service: "Meta Ads",
          ok: false,
          detail: `Token expira em ${daysLeft} dia(s). Renove em https://developers.facebook.com/tools/explorer/`,
        };
      }
      return { service: "Meta Ads", ok: true, detail: `Token válido. Expira em ${daysLeft} dia(s).` };
    }

    return { service: "Meta Ads", ok: true, detail: "Token válido (sem data de expiração — token de longa duração)." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { service: "Meta Ads", ok: false, detail: msg };
  }
}

async function sendAlert(failures: TokenResult[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@multitrip.com.br";
  const toEmail = process.env.ADMIN_ALERT_EMAIL ?? process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !toEmail) {
    console.error("[token-health] RESEND_API_KEY ou ADMIN_ALERT_EMAIL não configurados — alerta não enviado.");
    return;
  }

  const failureList = failures
    .map((f) => `<li><strong>${f.service}:</strong> ${f.detail}</li>`)
    .join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject: `⚠️ Token expirado ou inválido — multitrip.com.br`,
      html: `
        <h2>Alerta de Token — Multitrip</h2>
        <p>Os seguintes serviços apresentaram problemas de autenticação:</p>
        <ul>${failureList}</ul>
        <p>Acesse o painel e renove as credenciais antes que as integrações parem de funcionar.</p>
        <hr>
        <small>Enviado automaticamente por /api/cron/token-health</small>
      `,
    }),
  });
}

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const [zoho, meta] = await Promise.all([checkZohoToken(), checkMetaToken()]);
  const results = [zoho, meta];
  const failures = results.filter((r) => !r.ok);

  console.log("[token-health] Resultados:", JSON.stringify(results));

  if (failures.length > 0) {
    console.warn("[token-health] ⚠️ Falhas detectadas:", failures.map((f) => f.service).join(", "));
    await sendAlert(failures);
  } else {
    console.log("[token-health] ✅ Todos os tokens estão válidos.");
  }

  return NextResponse.json({
    ok: failures.length === 0,
    results,
    alertSent: failures.length > 0,
  });
}
