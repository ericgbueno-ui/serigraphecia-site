/**
 * /api/health/meta — Diagnóstico de env vars Meta (WhatsApp + Instagram)
 *
 * GET  → retorna JSON com status de cada variável (presente/ausente)
 * Protegido por header: Authorization: Bearer <ADMIN_PASSWORD>
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const VARS = {
  whatsapp: [
    "WHATSAPP_TOKEN",
    "WHATSAPP_PHONE_ID",
    "WHATSAPP_APP_SECRET",
    "WHATSAPP_VERIFY_TOKEN",
  ],
  instagram: [
    "INSTAGRAM_ACCESS_TOKEN",
    "INSTAGRAM_PAGE_ID",
    "INSTAGRAM_APP_SECRET",
    "INSTAGRAM_VERIFY_TOKEN",
  ],
} as const;

function present(name: string): boolean {
  return !!(process.env[name] && process.env[name]!.trim().length > 0);
}

export async function GET(req: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!adminPassword) {
    console.error("[health/meta] ADMIN_PASSWORD ausente — endpoint bloqueado.");
    return NextResponse.json({ error: "ADMIN_PASSWORD não configurado na env" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Checar Instagram: app_secret pode vir de INSTAGRAM_APP_SECRET ou WHATSAPP_APP_SECRET
  const igAppSecretPresent =
    present("INSTAGRAM_APP_SECRET") || present("WHATSAPP_APP_SECRET");

  const whatsapp = {
    token: present("WHATSAPP_TOKEN"),
    phone_id: present("WHATSAPP_PHONE_ID"),
    app_secret: present("WHATSAPP_APP_SECRET"),
    verify_token: present("WHATSAPP_VERIFY_TOKEN"),
  };

  const instagram = {
    access_token: present("INSTAGRAM_ACCESS_TOKEN"),
    page_id: present("INSTAGRAM_PAGE_ID"),
    app_secret: igAppSecretPresent,
    verify_token: present("INSTAGRAM_VERIFY_TOKEN"),
  };

  const criticalMissing: string[] = [];
  if (!whatsapp.token) criticalMissing.push("WHATSAPP_TOKEN");
  if (!whatsapp.phone_id) criticalMissing.push("WHATSAPP_PHONE_ID");
  if (!whatsapp.app_secret) criticalMissing.push("WHATSAPP_APP_SECRET");
  if (!instagram.access_token) criticalMissing.push("INSTAGRAM_ACCESS_TOKEN");
  if (!instagram.page_id) criticalMissing.push("INSTAGRAM_PAGE_ID");
  if (!instagram.verify_token) criticalMissing.push("INSTAGRAM_VERIFY_TOKEN");

  const hints: string[] = [];
  if (!whatsapp.phone_id) {
    hints.push(
      "WHATSAPP_PHONE_ID ausente ou errado — verifique o Phone Number ID específico da conta Jolie no Meta for Developers → WhatsApp → Configuração."
    );
  }
  if (!whatsapp.app_secret) {
    hints.push(
      "WHATSAPP_APP_SECRET ausente — o webhook rejeita TODOS os POSTs (fail-closed). Encontrar em: Meta for Developers → App → Configurações básicas → App Secret."
    );
  }
  if (!instagram.access_token || !instagram.page_id) {
    hints.push(
      "Instagram DM desativado — INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_PAGE_ID são obrigatórios para o webhook /api/instagram funcionar."
    );
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    whatsapp,
    instagram,
    critical_missing: criticalMissing,
    hints,
    ok: criticalMissing.length === 0,
  });
}
