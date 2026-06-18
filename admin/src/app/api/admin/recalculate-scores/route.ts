import { NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";
import { recalculateLeadScore } from "@/lib/lead";

export const runtime = "nodejs";

// POST /api/admin/recalculate-scores
// Recalcula o score de todos os leads ativos (não convertidos).
// Rota de uso único para recalibrar dados históricos.
export async function POST() {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { status: { not: "convertido" } },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    leads.map((l) => recalculateLeadScore(l.id))
  );

  const updated = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ ok: true, updated, failed, total: leads.length });
}
