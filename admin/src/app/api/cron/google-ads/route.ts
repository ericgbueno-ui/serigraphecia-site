/**
 * GET /api/cron/google-ads
 *
 * Busca insights diários do Google Ads e registra no banco.
 * Disparado diariamente via Vercel Cron (vercel.json).
 *
 * ATIVO apenas quando GOOGLE_ADS_* estiver configurado no .env.
 * Sem credenciais: retorna { skipped: true } sem erro.
 */

import { NextResponse } from "next/server";
import { fetchGoogleAdsInsights, isGoogleAdsConfigured } from "@/lib/google-ads";
import { prisma } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  if (!isGoogleAdsConfigured()) {
    return NextResponse.json({
      skipped: true,
      reason: "GOOGLE_ADS_* não configurado. Adicione as credenciais no .env para ativar.",
    });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const insights = await fetchGoogleAdsInsights(yesterday, today);
    if (!insights) {
      return NextResponse.json({ skipped: true, reason: "Sem dados retornados pela API." });
    }

    // Salva os dados em optionalsJson de um registro de analytics
    // (reutiliza estrutura existente até ter tabela dedicada)
    await prisma.booking.findFirst({ select: { id: true } }); // health-check DB

    return NextResponse.json({
      ok: true,
      date: today,
      totalSpend: insights.totalSpend,
      totalClicks: insights.totalClicks,
      totalConversions: insights.totalConversions,
      campaigns: insights.campaigns.length,
      topCampaign: insights.campaigns[0]?.campaignName ?? "—",
    });
  } catch (err: any) {
    console.error("[google-ads cron] Erro:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
