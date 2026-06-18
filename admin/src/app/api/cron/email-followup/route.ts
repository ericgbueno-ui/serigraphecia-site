/**
 * GET /api/cron/email-followup
 *
 * Detecta campanhas B2B enviadas há 7+ dias sem follow-up
 * e dispara o e-mail de retorno automaticamente.
 *
 * Roda toda segunda-feira às 9h BRT via Vercel Cron.
 * Proteção: Authorization: Bearer CRON_SECRET
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Campanhas B2B enviadas há 7+ dias sem nenhum follow-up
  const pending = await prisma.emailCampaign.findMany({
    where: {
      audience: "b2b",
      status: "sent",
      sentAt: { lte: sevenDaysAgo },
      followupCount: 0,
      recipientsJson: { not: null },
    },
    select: { id: true, title: true, sentAt: true },
  });

  if (pending.length === 0) {
    console.log("[email-followup] Nenhuma campanha pendente de follow-up.");
    return NextResponse.json({ ok: true, processed: 0 });
  }

  console.log(`[email-followup] ${pending.length} campanha(s) para follow-up.`);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://multitrip.com.br";
  const cronSecret = process.env.CRON_SECRET;
  const results: { id: string; title: string; result: string }[] = [];

  for (const campaign of pending) {
    try {
      const res = await fetch(`${baseUrl}/api/admin/email/campaigns/${campaign.id}/followup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      const data = await res.json();
      const summary = res.ok
        ? `✅ ${data.sent} enviados, ${data.failed} falhas`
        : `❌ ${data.error}`;
      results.push({ id: campaign.id, title: campaign.title, result: summary });
      console.log(`[email-followup] "${campaign.title}": ${summary}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: campaign.id, title: campaign.title, result: `❌ ${msg}` });
    }
  }

  return NextResponse.json({ ok: true, processed: pending.length, results });
}
