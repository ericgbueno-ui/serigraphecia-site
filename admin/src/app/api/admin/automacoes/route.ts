import { NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/automacoes — lista todos os fluxos ───────────────────────

export async function GET() {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const flows = await prisma.automationFlow.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { runs: true } },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, createdAt: true, completedAt: true },
      },
    },
  });

  return NextResponse.json(flows);
}

// ─── POST /api/admin/automacoes — cria novo fluxo ────────────────────────────

export async function POST(req: Request) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, active, triggerType, triggerConfig, steps } = body;

  if (!name || !triggerType) {
    return NextResponse.json({ error: "name e triggerType são obrigatórios" }, { status: 400 });
  }

  // Gera token para webhook automaticamente
  let finalTriggerConfig = triggerConfig ?? {};
  if (triggerType === "WEBHOOK" && !finalTriggerConfig.token) {
    finalTriggerConfig = { ...finalTriggerConfig, token: randomUUID().replace(/-/g, "") };
  }

  const flow = await prisma.automationFlow.create({
    data: {
      name,
      description: description ?? null,
      active: active ?? true,
      triggerType,
      triggerConfig: finalTriggerConfig,
      steps: steps ?? [],
    },
  });

  return NextResponse.json(flow, { status: 201 });
}
