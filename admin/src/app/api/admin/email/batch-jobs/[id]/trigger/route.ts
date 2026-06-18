// POST /api/admin/email/batch-jobs/[id]/trigger — TESTE MINIMO
export const maxDuration = 60;

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, test: "rota funcionando" });
}
