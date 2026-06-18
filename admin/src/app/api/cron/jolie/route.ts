/**
 * GET /api/cron/jolie
 *
 * Duas schedules no vercel.json:
 *  - Diária  09h BRT → ?job=automations  (D-1, reviews, reativação)
 *  - Semanal dom 02h → ?job=research     (pesquisa externa + alimenta JolieKnowledge)
 *
 * Protegido por CRON_SECRET.
 */

import { NextResponse } from "next/server";
import { runAllJolieAutomations } from "@/lib/jolie/automations";
import { runResearchAgent } from "@/lib/jolie/research";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const job = searchParams.get("job") ?? "automations";

  try {
    const results: Record<string, unknown> = { ran_at: new Date().toISOString(), job };

    if (job === "automations" || job === "all") {
      results.automations = await runAllJolieAutomations();
    }

    if (job === "research" || job === "all") {
      const logs = await runResearchAgent();
      results.research = {
        logs,
        total: logs.length,
        errors: logs.filter((l) => l.startsWith("❌")).length,
      };
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (err: any) {
    console.error("[cron/jolie] erro:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
