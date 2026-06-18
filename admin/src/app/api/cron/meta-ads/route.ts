/**
 * GET /api/cron/meta-ads
 *
 * Busca os gastos dos últimos 7 dias no Meta Ads e salva no banco.
 * Roda 3× por dia via Vercel Cron: 8h, 12h e 16h (horário de Brasília).
 *
 * Proteção: header Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchMetaAdInsights, toBrtDateString, brtDateMinus } from "@/lib/meta-ads";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const accountId = process.env.META_ADS_ACCOUNT_ID;
  if (!accountId) {
    return NextResponse.json(
      { error: "META_ADS_ACCOUNT_ID não configurado." },
      { status: 500 }
    );
  }

  // ── Período: últimos 7 dias ───────────────────────────────────────────────
  const today = toBrtDateString();
  const since = brtDateMinus(6); // 7 dias incluindo hoje

  console.log(`[meta-ads-cron] Buscando insights ${since} → ${today}`);

  let insights;
  try {
    insights = await fetchMetaAdInsights(since, today);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[meta-ads-cron] Erro ao buscar insights:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (!insights.length) {
    console.log("[meta-ads-cron] Nenhum dado retornado pela API.");
    return NextResponse.json({ message: "Sem dados no período.", upserted: 0 });
  }

  // ── Upsert no banco ───────────────────────────────────────────────────────
  let upserted = 0;

  for (const insight of insights) {
    await prisma.metaAdSpend.upsert({
      where: {
        date_accountId: { date: insight.date, accountId },
      },
      create: {
        date: insight.date,
        accountId,
        spend: insight.spend,
        impressions: insight.impressions,
        clicks: insight.clicks,
        reach: insight.reach,
        fetchedAt: new Date(),
      },
      update: {
        spend: insight.spend,
        impressions: insight.impressions,
        clicks: insight.clicks,
        reach: insight.reach,
        fetchedAt: new Date(),
      },
    });
    upserted++;
  }

  console.log(`[meta-ads-cron] ✅ ${upserted} registros atualizados.`);

  return NextResponse.json({
    message: `Meta Ads sincronizado.`,
    period: { since, until: today },
    upserted,
  });
}
