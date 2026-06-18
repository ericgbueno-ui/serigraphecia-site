import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";
import { FLOW_TEMPLATES } from "@/lib/automations/templates";

export const dynamic = "force-dynamic";

// ─── GET — lista templates disponíveis ───────────────────────────────────────

export async function GET() {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(FLOW_TEMPLATES);
}

// ─── POST — importa um template como novo fluxo ───────────────────────────────

export async function POST(req: Request) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { templateIndex } = await req.json();
  const tmpl = FLOW_TEMPLATES[templateIndex];
  if (!tmpl) {
    return NextResponse.json({ error: "template não encontrado" }, { status: 404 });
  }

  const flow = await prisma.automationFlow.create({
    data: {
      name: tmpl.name,
      description: tmpl.description,
      active: false, // Importado desativado para revisão
      triggerType: tmpl.triggerType,
      triggerConfig: tmpl.triggerConfig as unknown as Prisma.InputJsonValue,
      steps: tmpl.steps as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(flow, { status: 201 });
}
