import { NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/automacoes/[id] ──────────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const flow = await prisma.automationFlow.findUnique({
    where: { id },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          logs: true,
          error: true,
          inputData: true,
        },
      },
    },
  });

  if (!flow) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(flow);
}

// ─── PUT /api/admin/automacoes/[id] ──────────────────────────────────────────

export async function PUT(req: Request, { params }: Params) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, active, triggerType, triggerConfig, steps } = body;

  const flow = await prisma.automationFlow.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(active !== undefined && { active }),
      ...(triggerType !== undefined && { triggerType }),
      ...(triggerConfig !== undefined && { triggerConfig }),
      ...(steps !== undefined && { steps }),
    },
  });

  return NextResponse.json(flow);
}

// ─── DELETE /api/admin/automacoes/[id] ───────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.automationFlow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
