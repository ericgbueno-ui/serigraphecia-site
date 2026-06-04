import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateCriticalEnvVars } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [count, envStatus] = await Promise.all([
      prisma.affiliate.count(),
      Promise.resolve(validateCriticalEnvVars()),
    ]);
    return NextResponse.json({ ok: envStatus.ok, affiliates: count, env: envStatus });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
