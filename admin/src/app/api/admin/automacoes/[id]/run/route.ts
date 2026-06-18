import { NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { executeFlow } from "@/lib/automations/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/admin/automacoes/[id]/run — disparo manual ────────────────────

export async function POST(req: Request, { params }: Params) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let inputData: Record<string, unknown> = {};

  try {
    const body = await req.json();
    if (body && typeof body === "object") inputData = body;
  } catch {
    // input vazio — tudo bem
  }

  const result = await executeFlow(id, {
    ...inputData,
    _manual: true,
    triggeredAt: new Date().toISOString(),
  });

  return NextResponse.json(result);
}
