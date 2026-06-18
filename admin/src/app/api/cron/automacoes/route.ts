/**
 * GET /api/cron/automacoes
 * Roda a cada hora — executa todos os AutomationFlows do tipo SCHEDULE cujo
 * cron expression bate com o horário atual (UTC).
 * Protegido por CRON_SECRET.
 */

import { NextResponse } from "next/server";
import { runScheduledFlows } from "@/lib/automations/engine";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const results = await runScheduledFlows();

  return NextResponse.json({
    ran_at: new Date().toISOString(),
    flows: results,
    total: results.length,
  });
}
