/**
 * GET /api/cron/followup
 *
 * Disparado pelo Vercel Cron (vercel.json) diariamente às 10h BRT.
 * Protegido por CRON_SECRET para evitar chamadas externas.
 *
 * Executa:
 *  1. Follow-ups pós-compra (+1, +3, +7 dias)
 *  2. Reativação de leads frios (30, 60, 90 dias)
 */

import { NextResponse } from "next/server";
import { runPostPurchaseFollowups, runReactivationFollowups } from "@/lib/followup";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    const [purchaseLogs, reactivationLogs] = await Promise.all([
      runPostPurchaseFollowups(),
      runReactivationFollowups(),
    ]);

    const total = purchaseLogs.length + reactivationLogs.length;
    const errors = [...purchaseLogs, ...reactivationLogs].filter((l) => l.startsWith("❌")).length;

    console.log("[cron/followup] resultado:", { purchaseLogs, reactivationLogs });

    return NextResponse.json({
      ok: true,
      ran_at: new Date().toISOString(),
      total_actions: total,
      errors,
      purchase_followups: purchaseLogs,
      reactivation_followups: reactivationLogs,
    });
  } catch (err: any) {
    console.error("[cron/followup] erro:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
